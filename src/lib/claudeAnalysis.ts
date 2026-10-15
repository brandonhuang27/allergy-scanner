import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { ALLERGENS } from "@/data/allergens";
import { buildSystemPrompt } from "./prompt";
import type { AllergyProfile, ScanResult } from "./types";

// The Claude call itself, shared by the /api/analyze route and the
// test-labels script so both always run exactly the same analysis.

export const MODEL = "claude-opus-5-5";
/** How much Claude thinks before answering. SCAN_EFFORT overrides it, e.g. for tests. */
export const EFFORT = (process.env.SCAN_EFFORT ?? "low") as "low" | "medium" | "high";

const client = new Anthropic();

// The shape Claude must reply in. Structured outputs guarantee valid JSON
// matching this schema.
const OutputSchema = z.object({
  kind: z.enum(["label", "menu"]),
  readable: z.boolean(),
  detectedLanguage: z.string(),
  ingredientsText: z.string(),
  findings: z.array(
    z.object({
      verdict: z.enum(["contains", "possible", "unknown"]),
      dish: z.string(),
      allergen: z.string(),
      originalText: z.string(),
      translation: z.string(),
      reason: z.string(),
    }),
  ),
  message: z.string(),
});

/** Claude declined, or its answer was cut off or unparseable. */
export class AnalysisFailedError extends Error {
  /** Tokens used before failing (failed requests are still billed). */
  constructor(message: string, readonly usage?: Anthropic.Beta.BetaUsage) {
    super(message);
  }
}

export interface AnalysisOutcome {
  result: ScanResult;
  usage: Anthropic.Beta.BetaUsage;
}

/** Analyzes a base64-encoded JPEG (no data: prefix). Throws Anthropic.APIError or AnalysisFailedError. */
export async function analyzeWithClaude(
  jpegBase64: string,
  profile: AllergyProfile,
): Promise<AnalysisOutcome> {
  let response;
  // Streamed so long menus can use a large output limit without timing out.
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    output_config: { effort: EFFORT, format: betaZodOutputFormat(OutputSchema) },
    // If a safety classifier wrongly declines, retry on Anthropic's
    // recommended fallback model instead of failing.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: buildSystemPrompt(profile),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: jpegBase64 },
          },
          { type: "text", text: "Check this for my allergens." },
        ],
      },
    ],
  });
  try {
    response = await stream.finalMessage();
  } catch (error) {
    // API errors (auth, rate limits, ...) are handled by the caller. Other SDK
    // errors here mean the reply couldn't be parsed, e.g. it was cut off.
    if (error instanceof Anthropic.APIError || !(error instanceof Anthropic.AnthropicError)) throw error;
    throw new AnalysisFailedError(
      `Couldn't parse the response: ${error.message}`,
      stream.currentMessage?.usage,
    );
  }

  if (response.stop_reason === "refusal") {
    throw new AnalysisFailedError("Claude declined to analyze this image.", response.usage);
  }
  const output = response.parsed_output;
  if (!output || response.stop_reason === "max_tokens") {
    throw new AnalysisFailedError(
      `Incomplete response (stop_reason: ${response.stop_reason}).`,
      response.usage,
    );
  }

  return {
    result: {
      kind: output.kind,
      readable: output.readable,
      detectedLanguage: output.detectedLanguage,
      ingredientsText: output.ingredientsText,
      findings: output.findings.map(({ dish, ...f }) => ({
        ...f,
        ...(dish.trim() ? { dish: dish.trim() } : {}),
        allergen: normalizeAllergen(f.allergen, profile.custom),
      })),
      message: output.message || undefined,
    },
    usage: response.usage,
  };
}

/**
 * Maps Claude's allergen value back to an id or the user's custom name, in
 * case it answered "Tree nuts" instead of "tree-nuts". Unmatched values are
 * kept as-is so a finding is never dropped.
 */
function normalizeAllergen(value: string, custom: string[]): string {
  const v = value.trim().toLowerCase();
  const known = ALLERGENS.find((a) => a.id === v || a.label.toLowerCase() === v);
  if (known) return known.id;
  return custom.find((c) => c.toLowerCase() === v) ?? value;
}
