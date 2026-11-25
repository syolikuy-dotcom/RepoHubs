import "server-only";
import { getVercelSession } from "./session";

export class VcError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function vcRequest(session, path, { method = "GET", body } = {}) {
  const url = new URL(`https://api.vercel.com${path}`);
  if (session.teamId && !url.searchParams.has("teamId")) url.searchParams.set("teamId", session.teamId);
  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${session.token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = "";
    try { msg = (await res.json())?.error?.message; } catch {}
    if (res.status === 401 || res.status === 403) msg = "Token Vercel tidak valid atau tidak punya akses.";
    if (res.status === 429) msg = "Rate limit Vercel, coba lagi sebentar.";
    throw new VcError(res.status, msg || `Vercel API error (${res.status})`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** Untuk server components. Return null kalau Vercel belum terhubung. */
export async function vc(path, opts) {
  const s = await getVercelSession();
  if (!s) return null;
  return vcRequest(s, path, opts);
}
