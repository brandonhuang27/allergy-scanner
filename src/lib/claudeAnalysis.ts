import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { ALLERGENS } from "@/data/allergens";
import { buildSystemPrompt } from "./prompt";
import type { AllergyProfile, ScanResult } from "./types";

// The Claude call itself, shared by the /api/analyze route and the
// test-labels script so both always run exactly the same analysis.

export const MODEL = "claude-opus-5-5";

const client = new Anthropic();

// The shape Claude must reply in. Structured outputs guarantee valid JSON
// matching this schema.
const OutputSchema = z.object({
  readable: z.boolean(),
  detectedLanguage: z.string(),
  ingredientsText: z.string(),
  findings: z.array(
    z.object({
      verdict: z.enum(["contains", "possible", "unknown"]),
      allergen: z.string(),
      originalText: z.string(),
      translation: z.string(),
      reason: z.string(),
    }),
  ),
  message: z.string(),
});

/** Claude declined, or its answer was cut off or unparseable. */
export class AnalysisFailedError extends Error {}

export interface AnalysisOutcome {
  result: ScanResult;
  usage: Anthropic.Beta.BetaUsage;
}

/** Analyzes a base64-encoded JPEG (no data: prefix). Throws Anthropic.APIError or AnalysisFailedError. */
export async function analyzeWithClaude(
  jpegBase64: string,
  profile: AllergyProfile,
): Promise<AnalysisOutcome> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "high", format: betaZodOutputFormat(OutputSchema) },
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
          { type: "text", text: "Check this label for my allergens." },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new AnalysisFailedError("Claude declined to analyze this image.");
  }
  const output = response.parsed_output;
  if (!output || response.stop_reason === "max_tokens") {
    throw new AnalysisFailedError(`Incomplete response (stop_reason: ${response.stop_reason}).`);
  }

  return {
    result: {
      readable: output.readable,
      detectedLanguage: output.detectedLanguage,
      ingredientsText: output.ingredientsText,
      findings: output.findings.map((f) => ({
        ...f,
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
