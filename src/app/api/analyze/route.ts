import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ALLERGENS, type AllergenId } from "@/data/allergens";
import { checkAccessCode } from "@/lib/accessCode";
import { AnalysisFailedError, analyzeWithClaude } from "@/lib/claudeAnalysis";

// Receives a label photo and the user's allergies, asks Claude to analyze it,
// and returns a ScanResult. Runs on the server, so the API key never reaches
// the browser.

export const maxDuration = 120;

const DATA_URL_PREFIX = "data:image/jpeg;base64,";
const MAX_IMAGE_CHARS = 7_000_000; // ~5 MB of base64; resized photos are far smaller.

const ALLERGEN_IDS = ALLERGENS.map((a) => a.id) as [AllergenId, ...AllergenId[]];

const RequestSchema = z.object({
  image: z.string().startsWith(DATA_URL_PREFIX).max(MAX_IMAGE_CHARS),
  profile: z.object({
    allergens: z.array(z.enum(ALLERGEN_IDS)).max(ALLERGEN_IDS.length),
    custom: z.array(z.string().trim().min(1).max(60)).max(20),
  }),
});

function errorResponse(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const denied = checkAccessCode(request);
  if (denied) return denied;

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
    const { result } = await analyzeWithClaude(image.slice(DATA_URL_PREFIX.length), profile);
    return Response.json(result);
  } catch (error) {
    if (error instanceof AnalysisFailedError) {
      console.error("Analysis failed:", error.message);
      return errorResponse(502, "This photo couldn't be analyzed. Try again or use a different photo.");
    }
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
