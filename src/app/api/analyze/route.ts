import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { ALLERGENS, type AllergenId } from "@/data/allergens";
import { buildSystemPrompt } from "@/lib/prompt";
import type { ScanResult } from "@/lib/types";

// Receives a label photo and the user's allergies, asks Claude to analyze it,
// and returns a ScanResult. Runs on the server, so the API key never reaches
// the browser.

export const maxDuration = 120;

const MODEL = "claude-opus-5-5";
const MAX_IMAGE_CHARS = 7_000_000; // ~5 MB of base64; resized photos are far smaller.

const client = new Anthropic();

const ALLERGEN_IDS = ALLERGENS.map((a) => a.id) as [AllergenId, ...AllergenId[]];

const RequestSchema = z.object({
  image: z
    .string()
    .startsWith("data:image/jpeg;base64,")
    .max(MAX_IMAGE_CHARS),
  profile: z.object({
    allergens: z.array(z.enum(ALLERGEN_IDS)).max(ALLERGEN_IDS.length),
    custom: z.array(z.string().trim().min(1).max(60)).max(20),
  }),
});

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

function errorResponse(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return errorResponse(400, "That photo or allergy list couldn't be read. Please try again.");
  }
  const { image, profile } = body;
  if (profile.allergens.length + profile.custom.length === 0) {
    return errorResponse(400, "Pick at least one allergy first.");
  }

  try {
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
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image.slice("data:image/jpeg;base64,".length),
              },
            },
            { type: "text", text: "Check this label for my allergens." },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return errorResponse(502, "This photo couldn't be analyzed. Try a different photo.");
    }
    const output = response.parsed_output;
    if (!output || response.stop_reason === "max_tokens") {
      return errorResponse(502, "The analysis came back incomplete. Please try again.");
    }

    const result: ScanResult = {
      readable: output.readable,
      detectedLanguage: output.detectedLanguage,
      ingredientsText: output.ingredientsText,
      findings: output.findings.map((f) => ({
        ...f,
        allergen: normalizeAllergen(f.allergen, profile.custom),
      })),
      message: output.message || undefined,
    };
    return Response.json(result);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic API key is missing or invalid.");
      return errorResponse(500, "The server isn't set up correctly (API key).");
    }
    if (error instanceof Anthropic.RateLimitError) {
      return errorResponse(429, "Too many scans right now. Wait a moment and try again.");
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("Anthropic rejected the request:", error.message);
      return errorResponse(502, "This photo couldn't be analyzed. Try a different photo.");
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      return errorResponse(502, "The analysis service had a problem. Please try again.");
    }
    console.error("Unexpected error analyzing label:", error);
    return errorResponse(500, "Something went wrong. Please try again.");
  }
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
