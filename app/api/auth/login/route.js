import { clientIp, guard, json, rateLimit } from "@/lib/http";
import { setSession } from "@/lib/session";

const TOKEN_RE = /^[A-Za-z0-9_]{20,255}$/;

export async function POST(req) {
  if (!guard(req)) return json({ message: "Request ditolak." }, 403);
  if (!rateLimit(`login:${clientIp(req)}`)) {
    return json({ message: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." }, 429);
  }
  const { token } = await req.json().catch(() => ({}));
  if (typeof token !== "string" || !TOKEN_RE.test(token.trim())) {
    return json({ message: "Format token tidak valid." }, 400);
  }
  const res = await fetch("https://api.github.com/user", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token.trim()}`, Accept: "application/vnd.github+json", "User-Agent": "RepoHub" },
  });
  if (!res.ok) return json({ message: "Token ditolak GitHub. Cek token dan scope-nya." }, 401);
  const u = await res.json();
  const scopes = (res.headers.get("x-oauth-scopes") || "").split(",").map((s) => s.trim()).filter(Boolean);
  await setSession({
    token: token.trim(),
    scopes,
    user: { login: u.login, id: u.id, name: u.name, avatar_url: u.avatar_url },
  });
  return json({ ok: true, login: u.login });
}
