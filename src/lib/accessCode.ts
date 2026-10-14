import { createHash, timingSafeEqual } from "node:crypto";

// Only people with the access code can run scans, so a shared link can't
// spend the API budget. The code is set with the ACCESS_CODE environment
// variable and sent by the browser in the x-access-code header.

export const BAD_ACCESS_CODE = "bad_access_code";

const sha256 = (s: string) => createHash("sha256").update(s).digest();

/** Returns an error Response if the request may not proceed, or null if it may. */
export function checkAccessCode(request: Request): Response | null {
  const expected = process.env.ACCESS_CODE;
  if (!expected) {
    // Locally the app can run without a code; a deployed app must have one.
    if (process.env.NODE_ENV !== "production") return null;
    console.error("ACCESS_CODE is not set; refusing all scans.");
    return Response.json({ error: "The server isn't set up correctly (access code)." }, { status: 500 });
  }

  const provided = request.headers.get("x-access-code")?.trim() ?? "";
  // Compare hashes so the comparison takes the same time whatever the input.
  if (!timingSafeEqual(sha256(provided.toLowerCase()), sha256(expected.trim().toLowerCase()))) {
    return Response.json(
      { error: "That access code isn't right.", code: BAD_ACCESS_CODE },
      { status: 401 },
    );
  }
  return null;
}
