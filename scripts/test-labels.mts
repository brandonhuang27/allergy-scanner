// Runs every case in test-labels/cases.json through the same Claude analysis
// the app uses, and reports missed allergens, false alarms and cost.
//
//   npm run test:labels                       # all cases
//   npm run test:labels -- --only ja          # cases whose image name contains "ja"
//   npm run test:labels -- --repeat 3         # run each case 3 times (checks consistency)
//   npm run test:labels -- --cases other.json # use a different list of cases
//   npm run test:labels -- --budget 3         # keep the run's total cost under $3
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
const { analyzeWithClaude, AnalysisFailedError, EFFORT, MODEL } = await import(
  "../src/lib/claudeAnalysis"
);

// Opus 5.5 list prices, USD per million tokens. Update if you change MODEL.
const PRICE = { input: 4, output: 20 };

const DIR = "test-labels";
const ids = ALLERGENS.map((a) => a.id) as [AllergenId, ...AllergenId[]];
const Allergen = z.union([z.enum(ids), z.string()]);

// Menus: a dish is found by matching any of `match` (case-insensitive) against
// each finding's dish name or original text.
const DishSchema = z.object({
  match: z.array(z.string()).min(1),
  /** Must be flagged for this dish (as contains or possible). */
  mustFlag: z.array(Allergen).default([]),
  /** Must not be marked "contains" for this dish. */
  notContains: z.array(Allergen).default([]),
});

const CaseSchema = z.object({
  image: z.string(),
  kind: z.enum(["label", "menu"]).default("label"),
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
  dishes: z.array(DishSchema).default([]),
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
  /** Called a label a menu or the other way round. */
  wrongKind: boolean;
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

  const g: Grade = {
    missed: [...c.expect.contains, ...c.expect.possible].filter((a) => !flagged(a)),
    underFlagged: c.expect.contains.filter((a) => flagged(a) && !flaggedContains(a)),
    falseAlarms: c.expect.absent.filter(flaggedContains),
    noise: c.expect.absent.filter((a) => flagged(a) && !flaggedContains(a)),
    unreadableNotReported: c.unreadable && r.readable && !r.message,
    wrongKind: !c.unreadable && r.readable && r.kind !== c.kind,
  };

  for (const d of c.dishes) {
    const needles = d.match.map((m) => m.toLowerCase());
    const about = r.findings.filter((f) =>
      needles.some((n) => `${f.dish ?? ""} ${f.originalText}`.toLowerCase().includes(n)),
    );
    const name = d.match[0];
    const has = (a: string, verdict?: string) =>
      about.some((f) => f.allergen.toLowerCase() === a.toLowerCase() && (!verdict || f.verdict === verdict));
    g.missed.push(...d.mustFlag.filter((a) => !has(a)).map((a) => `${name} → ${a}`));
    g.falseAlarms.push(...d.notContains.filter((a) => has(a, "contains")).map((a) => `${name} → ${a}`));
  }
  return g;
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
  return {
    only: get("--only"),
    repeat: Number(get("--repeat") ?? 1),
    casesFile: get("--cases") ?? path.join(DIR, "cases.json"),
    budget: get("--budget") === undefined ? Infinity : Number(get("--budget")),
  };
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

type Usage = Awaited<ReturnType<typeof analyzeWithClaude>>["usage"];

function costOf(usage: Usage): number {
  const input =
    usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
  return (input * PRICE.input + usage.output_tokens * PRICE.output) / 1e6;
}

async function runCase(c: Case, attempt: number): Promise<Run> {
  const start = Date.now();
  try {
    const image = await prepareImage(path.join(DIR, "images", c.image));
    const { result, usage } = await analyzeWithClaude(image, {
      allergens: c.allergens,
      custom: c.custom,
    });
    return {
      image: c.image,
      attempt,
      seconds: (Date.now() - start) / 1000,
      costUsd: costOf(usage),
      result,
      grade: grade(c, result),
    };
  } catch (e) {
    return {
      image: c.image,
      attempt,
      seconds: (Date.now() - start) / 1000,
      // Failed requests are still billed; count them when the usage is known.
      costUsd: e instanceof AnalysisFailedError && e.usage ? costOf(e.usage) : 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Runs cases with at most `limit` in flight, to stay under API rate limits.
 * Before starting a case, reserves room for every running case to cost as much
 * as the most expensive case so far (at least $0.50), so the total stays
 * within `budget`.
 */
async function pool(tasks: (() => Promise<Run>)[], limit: number, budget: number) {
  const results: Run[] = [];
  let next = 0;
  let spent = 0;
  let running = 0;
  let reserve = 0.5;
  async function worker() {
    while (next < tasks.length && spent + (running + 1) * reserve <= budget) {
      const i = next++;
      running++;
      results[i] = await tasks[i]();
      running--;
      spent += results[i].costUsd;
      reserve = Math.max(reserve, results[i].costUsd);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  const done = results.filter(Boolean);
  return { results: done, skipped: tasks.length - done.length };
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
    g.wrongKind && yellow(`treated as a ${run.result!.kind}`),
    g.falseAlarms.length && yellow(`false alarm ${g.falseAlarms.join(", ")}`),
    g.underFlagged.length && yellow(`only "possible" for ${g.underFlagged.join(", ")}`),
    g.noise.length && `noise ${g.noise.join(", ")}`,
  ].filter(Boolean);
  const status = g.missed.length || g.unreadableNotReported ? red("FAIL ") : green("PASS ");
  const meta = `${run.seconds.toFixed(1)}s $${run.costUsd.toFixed(3)}`;
  return `${status}  ${label}  ${meta}${problems.length ? "\n         " + problems.join(" · ") : ""}`;
}

async function main() {
  const { only, repeat, casesFile, budget } = parseArgs();
  const cases = z
    .array(CaseSchema)
    .parse(JSON.parse(readFileSync(casesFile, "utf8")))
    .filter((c) => !only || c.image.includes(only));
  if (cases.length === 0) throw new Error("No matching cases.");

  const cap = Number.isFinite(budget) ? `, budget $${budget}` : "";
  console.log(`Running ${cases.length} case(s) × ${repeat} on ${MODEL} (effort: ${EFFORT}${cap})...\n`);
  const tasks = cases.flatMap((c) =>
    Array.from({ length: repeat }, (_, i) => () => runCase(c, i + 1)),
  );
  const { results: runs, skipped } = await pool(tasks, 4, budget);
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
  Label/menu mix-ups:    ${count((g) => Number(g.wrongKind))}
  Errors:                ${runs.filter((r) => r.error).length}
  Skipped (budget):      ${skipped}
  Avg time: ${avgSeconds.toFixed(1)}s   Total cost: $${cost.toFixed(2)}
  ${failures.length === 0 && runs.every((r) => !r.error) ? green(skipped ? `All ${runs.length} that ran passed (${skipped} skipped).` : "All passed.") : red(`${failures.length} failing run(s).`)}`);

  const outDir = path.join(DIR, "results");
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(outFile, JSON.stringify({ model: MODEL, effort: EFFORT, runs }, null, 2));
  console.log(`\nFull results saved to ${outFile}`);

  if (failures.length || skipped || runs.some((r) => r.error)) process.exitCode = 1;
}

await main();
