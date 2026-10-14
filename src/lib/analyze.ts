import type { AllergyProfile, ScanResult } from "./types";

/** Sends the photo to /api/analyze. Throws an Error with a user-facing message on failure. */
export async function analyzeLabel(
  imageDataUrl: string,
  profile: AllergyProfile,
): Promise<ScanResult> {
  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageDataUrl, profile }),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? "Something went wrong checking this label. Please try again.");
  }
  return data as ScanResult;
}
