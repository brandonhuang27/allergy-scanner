import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ALLERGENS, type AllergenId } from "@/data/allergens";
import { checkAccessCode } from "@/lib/accessCode";

// Saves a thumbs up / down on a scan result to Supabase, with the person's
// photo if they opted in. Uses the secret key, so this only runs on the server.

const DATA_URL_PREFIX = "data:image/jpeg;base64,";
const BUCKET = "feedback-photos";

const ALLERGEN_IDS = ALLERGENS.map((a) => a.id) as [AllergenId, ...AllergenId[]];

const FeedbackSchema = z.object({
  rating: z.enum(["up", "down"]),
  comment: z.string().trim().max(2000).optional(),
  profile: z.object({
    allergens: z.array(z.enum(ALLERGEN_IDS)).max(ALLERGEN_IDS.length),
    custom: z.array(z.string().max(60)).max(20),
  }),
  // Stored as-is for review; capped so a bad client can't send huge payloads.
  result: z.record(z.string(), z.unknown()).refine((r) => JSON.stringify(r).length < 100_000),
  photo: z.string().startsWith(DATA_URL_PREFIX).max(7_000_000).optional(),
});

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request) {
  const denied = checkAccessCode(request);
  if (denied) return denied;

  const parsed = FeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Couldn't read that feedback." }, { status: 400 });
  }
  const { rating, comment, profile, result, photo } = parsed.data;

  const supabase = getSupabase();
  if (!supabase) {
    console.error("SUPABASE_URL or SUPABASE_SECRET_KEY is not set; feedback not saved.");
    return Response.json({ error: "Feedback isn't set up yet." }, { status: 500 });
  }

  const id = randomUUID();
  let photoPath: string | null = null;
  if (photo) {
    photoPath = `${id}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(photoPath, Buffer.from(photo.slice(DATA_URL_PREFIX.length), "base64"), {
        contentType: "image/jpeg",
      });
    if (error) {
      // Still save the rating and comment without the photo.
      console.error("Feedback photo upload failed:", error.message);
      photoPath = null;
    }
  }

  const { error } = await supabase.from("feedback").insert({
    id,
    rating,
    comment: comment || null,
    profile,
    result,
    photo_path: photoPath,
  });
  if (error) {
    console.error("Saving feedback failed:", error.message);
    return Response.json({ error: "Couldn't save your feedback. Please try again." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
