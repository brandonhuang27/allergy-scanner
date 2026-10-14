// Runs every case in test-labels/cases.json through the same Claude analysis
// the app uses, and reports missed allergens, false alarms and cost.
//
//   npm run test:labels                       # all cases
//   npm run test:labels -- --only ja          # cases whose image name contains "ja"
//   npm run test:labels -- --repeat 3         # run each case 3 times (checks consistency)
//
// Every run calls the Claude API and costs money (a few cents per case).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { ALLERGENS, type AllergenId } from "../src/data/allergens";
import type { ScanResult } from "../src/lib/types";

process.loadEnvFile(".env.local");
// Imported after loading the env file so the Anthropic client sees the API key.
const { analyzeWithClaude, MODEL } = await import("../src/lib/claudeAnalysis");

// Opus 5.5 list prices, USD per million tokens. Update if you change MODEL.
const PRICE = { input: 4, output: 20 };

const DIR = "test-labels";
const ids = ALLERGENS.map((a) => a.id) as [AllergenId, ...AllergenId[]];
const Allergen = z.union([z.enum(ids), z.string()]);

const CaseSchema = z.object({
  image: z.string(),
  allergens: z.array(z.enum(ids)),
  custom: z.array(z.string()).default([]),
  unreadable: z.boolean().default(false),
  expect: z
    .object({
      contains: z.array(Allergen).default([]),
      possible: z.array(Allergen).default([]),
      absent: z.array(Allergen).default([]),
    })
    .default({ contains: [], possible: [], absent: [] }),
  notes: z.string().optional(),
});
type Case = z.infer<typeof CaseSchema>;

interface Grade {
  /** Expected allergen not flagged at all. The number that matters most. */
  missed: string[];
  /** Expected "contains", but only flagged as possible/unknown. */
  underFlagged: string[];
  /** Expected absent, but flagged as "contains". */
  falseAlarms: string[];
  /** Expected absent, flagged as possible/unknown. Acceptable, but noisy. */
  noise: string[];
  /** For unreadable cases: claimed to read it without warning the user. */
  unreadableNotReported: boolean;
}

function grade(c: Case, r: ScanResult): Grade {
  const verdicts = new Map<string, Set<string>>();
  for (const f of r.findings) {
    const key = f.allergen.toLowerCase();
    if (!verdicts.has(key)) verdicts.set(key, new Set());
    verdicts.get(key)!.add(f.verdict);
  }
  const flagged = (a: string) => verdicts.has(a.toLowerCase());
  const flaggedContains = (a: string) => verdicts.get(a.toLowerCase())?.has("contains") ?? false;

  return {
    missed: [...c.expect.contains, ...c.expect.possible].filter((a) => !flagged(a)),
    underFlagged: c.expect.contains.filter((a) => flagged(a) && !flaggedContains(a)),
    falseAlarms: c.expect.absent.filter(flaggedContains),
    noise: c.expect.absent.filter((a) => flagged(a) && !flaggedContains(a)),
    unreadableNotReported: c.unreadable && r.readable && !r.message,
  };
}

/** Same preparation as the browser: fix rotation, fit within 1568px, JPEG. */
async function prepareImage(file: string): Promise<string> {
  const buf = await sharp(file)
    .rotate()
    .resize({ width: 1568, height: 1568, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return buf.toString("base64");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return { only: get("--only"), repeat: Number(get("--repeat") ?? 1) };
}

interface Run {
  image: string;
  attempt: number;
  seconds: number;
  costUsd: number;
  result?: ScanResult;
  grade?: Grade;
  error?: string;
}

async function runCase(c: Case, attempt: number): Promise<Run> {
  const start = Date.now();
  try {
    const image = await prepareImage(path.join(DIR, "images", c.image));
    const { result, usage } = await analyzeWithClaude(image, {
      allergens: c.allergens,
      custom: c.custom,
    });
    const inputTokens =
      usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
    return {
      image: c.image,
      attempt,
      seconds: (Date.now() - start) / 1000,
      costUsd: (inputTokens * PRICE.input + usage.output_tokens * PRICE.output) / 1e6,
      result,
      grade: grade(c, result),
    };
  } catch (e) {
    return {
      image: c.image,
      attempt,
      seconds: (Date.now() - start) / 1000,
      costUsd: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Runs tasks with at most `limit` in flight, to stay under API rate limits. */
async function pool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;

function describe(run: Run): string {
  const label = `${run.image}${run.attempt > 1 ? ` (#${run.attempt})` : ""}`;
  if (run.error) return `${red("ERROR")}  ${label}: ${run.error}`;
  const g = run.grade!;
  const problems = [
    g.missed.length && red(`MISSED ${g.missed.join(", ")}`),
    g.unreadableNotReported && red("read a blurry label without warning"),
    g.falseAlarms.length && yellow(`false alarm ${g.falseAlarms.join(", ")}`),
    g.underFlagged.length && yellow(`only "possible" for ${g.underFlagged.join(", ")}`),
    g.noise.length && `noise ${g.noise.join(", ")}`,
  ].filter(Boolean);
  const status = g.missed.length || g.unreadableNotReported ? red("FAIL ") : green("PASS ");
  const meta = `${run.seconds.toFixed(1)}s $${run.costUsd.toFixed(3)}`;
  return `${status}  ${label}  ${meta}${problems.length ? "\n         " + problems.join(" · ") : ""}`;
}

async function main() {
  const { only, repeat } = parseArgs();
  const cases = z
    .array(CaseSchema)
    .parse(JSON.parse(readFileSync(path.join(DIR, "cases.json"), "utf8")))
    .filter((c) => !only || c.image.includes(only));
  if (cases.length === 0) throw new Error("No matching cases.");

  console.log(`Running ${cases.length} case(s) × ${repeat} on ${MODEL}...\n`);
  const tasks = cases.flatMap((c) =>
    Array.from({ length: repeat }, (_, i) => () => runCase(c, i + 1)),
  );
  const runs = await pool(tasks, 4);
  runs.forEach((r) => console.log(describe(r)));

  const graded = runs.filter((r) => r.grade);
  const count = (f: (g: Grade) => number) => graded.reduce((n, r) => n + f(r.grade!), 0);
  const failures = graded.filter((r) => r.grade!.missed.length || r.grade!.unreadableNotReported);
  const cost = runs.reduce((n, r) => n + r.costUsd, 0);
  const avgSeconds = graded.reduce((n, r) => n + r.seconds, 0) / Math.max(graded.length, 1);

  console.log(`
Summary (${runs.length} runs)
  Missed allergens:      ${count((g) => g.missed.length)}   <- must be 0
  Blurry not reported:   ${count((g) => Number(g.unreadableNotReported))}
  False alarms:          ${count((g) => g.falseAlarms.length)}
  Under-flagged:         ${count((g) => g.underFlagged.length)}
  Noise (possible flags on absent allergens): ${count((g) => g.noise.length)}
  Errors:                ${runs.filter((r) => r.error).length}
  Avg time: ${avgSeconds.toFixed(1)}s   Total cost: $${cost.toFixed(2)}
  ${failures.length === 0 && runs.every((r) => !r.error) ? green("All passed.") : red(`${failures.length} failing run(s).`)}`);

  const outDir = path.join(DIR, "results");
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(outFile, JSON.stringify({ model: MODEL, runs }, null, 2));
  console.log(`\nFull results saved to ${outFile}`);

  if (failures.length || runs.some((r) => r.error)) process.exitCode = 1;
}

await main();
