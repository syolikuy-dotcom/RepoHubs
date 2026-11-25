import { guard, json } from "@/lib/http";
import { clearSession } from "@/lib/session";

export async function POST(req) {
  if (!guard(req)) return json({ message: "Request ditolak." }, 403);
  await clearSession();
  return json({ ok: true });
}
