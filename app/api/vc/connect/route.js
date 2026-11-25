import { clientIp, guard, json, rateLimit } from "@/lib/http";
import { clearVercelSession, setVercelSession } from "@/lib/session";
import { VcError, vcRequest } from "@/lib/vercel";

export async function POST(req) {
  if (!guard(req)) return json({ message: "Request ditolak." }, 403);
  if (!rateLimit(`vc:${clientIp(req)}`)) return json({ message: "Terlalu banyak percobaan." }, 429);
  const { token, teamId } = await req.json().catch(() => ({}));
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{16,255}$/.test(token.trim())) {
    return json({ message: "Format token Vercel tidak valid." }, 400);
  }
  const team = typeof teamId === "string" && /^[A-Za-z0-9_-]{0,64}$/.test(teamId.trim()) ? teamId.trim() : "";
  try {
    const me = await vcRequest({ token: token.trim(), teamId: team }, "/v2/user");
    await setVercelSession({ token: token.trim(), teamId: team });
    return json({ ok: true, name: me?.user?.name || me?.user?.username });
  } catch (e) {
    return json({ message: e instanceof VcError ? e.message : "Gagal verifikasi token." }, 401);
  }
}

export async function DELETE(req) {
  if (!guard(req)) return json({ message: "Request ditolak." }, 403);
  await clearVercelSession();
  return json({ ok: true });
}
