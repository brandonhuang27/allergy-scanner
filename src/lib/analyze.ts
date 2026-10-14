import { getAccessCode } from "./profileStore";
import type { AllergyProfile, ScanResult } from "./types";

/** The server rejected the saved access code; the user needs to enter it again. */
export class AccessCodeError extends Error {}

/** Asks the server whether an access code is valid. Doesn't run a scan. */
export async function checkCode(code: string): Promise<boolean> {
  const res = await fetch("/api/check-code", {
    method: "POST",
    headers: { "x-access-code": code },
  });
  if (res.ok) return true;
  if (res.status === 401) return false;
  const data = await res.json().catch(() => null);
  throw new Error(data?.error ?? "Couldn't check the code. Please try again.");
}

/** Sends the photo to /api/analyze. Throws an Error with a user-facing message on failure. */
export async function analyzeLabel(
  imageDataUrl: string,
  profile: AllergyProfile,
): Promise<ScanResult> {
  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-access-code": getAccessCode() ?? "" },
      body: JSON.stringify({ image: imageDataUrl, profile }),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => null);
  if (res.status === 401) throw new AccessCodeError(data?.error ?? "Please enter your access code.");
  if (!res.ok) {
    throw new Error(data?.error ?? "Something went wrong checking this label. Please try again.");
  }
  return data as ScanResult;
}

export interface FeedbackInput {
  rating: "up" | "down";
  comment?: string;
  profile: AllergyProfile;
  result: ScanResult;
  /** The label photo, only if the person chose to share it. */
  photo?: string;
}

/** Saves a thumbs up / down. Throws an Error with a user-facing message on failure. */
export async function sendFeedback(feedback: FeedbackInput): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-access-code": getAccessCode() ?? "" },
      body: JSON.stringify(feedback),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Couldn't send feedback. Please try again.");
  }
}
