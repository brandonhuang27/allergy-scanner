import { checkAccessCode } from "@/lib/accessCode";

// Lets the access code screen check a code without running (and paying for) a scan.
export async function POST(request: Request) {
  return checkAccessCode(request) ?? Response.json({ ok: true });
}
