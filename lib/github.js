import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireSession } from "./session";

const API = "https://api.github.com";

export class GhError extends Error {
  constructor(status, message, reset) {
    super(message);
    this.status = status;
    this.reset = reset;
  }
}

function friendly(status, message, res) {
  if (status === 401) return "Token tidak valid atau sudah kedaluwarsa. Login ulang.";
  if (status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
    const mins = Math.max(1, Math.ceil((reset - Date.now()) / 60000));
    return `Rate limit GitHub habis. Coba lagi dalam ${mins} menit.`;
  }
  if (status === 403) return message || "Akses ditolak. Cek scope token (butuh 'repo').";
  if (status === 404) return "Tidak ditemukan.";
  return message || `GitHub API error (${status})`;
}

async function request(path, { method = "GET", body, accept, token } = {}) {
  const tk = token ?? (await requireSession()).token;
  const res = await fetch(path.startsWith("http") ? path : API + path, {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${tk}`,
      Accept: accept || "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "RepoHub",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function parse(res) {
  if (!res.ok) {
    let msg = "";
    try { msg = (await res.json()).message; } catch {}
    throw new GhError(res.status, friendly(res.status, msg, res));
  }
  if (res.status === 204) return null;
  const type = res.headers.get("content-type") || "";
  return type.includes("json") ? res.json() : res.text();
}

/** GET/POST/... ke GitHub dengan token sesi. Return body (json atau text). */
export async function gh(path, opts) {
  const res = await request(path, opts);
  if (opts?.text && res.ok) return res.text(); // paksa string (mis. README / file mentah)
  return parse(res);
}

/** Seperti gh() tapi juga return info pagination dari header Link. */
export async function ghPage(path, opts) {
  const res = await request(path, opts);
  const link = res.headers.get("link") || "";
  const pick = (rel) => {
    const m = link.match(new RegExp(`<[^>]*[?&]page=(\\d+)[^>]*>;\\s*rel="${rel}"`));
    return m ? Number(m[1]) : null;
  };
  const data = await parse(res);
  return { data, next: pick("next"), prev: pick("prev"), last: pick("last") };
}

/** Cek status (mis. apakah repo sudah di-star). */
export async function ghStatus(path) {
  return (await request(path)).status;
}

/** Jalankan promise, kalau gagal return fallback. Untuk data opsional. */
export async function safe(promise, fallback = null) {
  try { return await promise; } catch { return fallback; }
}

/** Ubah 404 jadi halaman not-found. */
export async function orNotFound(promise) {
  try { return await promise; } catch (e) {
    if (e instanceof GhError && e.status === 404) notFound();
    throw e;
  }
}

export const getRepo = cache(async (owner, repo) => orNotFound(gh(`/repos/${owner}/${repo}`)));

export const getRefs = cache(async (owner, repo) => {
  const [branches, tags] = await Promise.all([
    safe(gh(`/repos/${owner}/${repo}/branches?per_page=100`), []),
    safe(gh(`/repos/${owner}/${repo}/tags?per_page=100`), []),
  ]);
  return { branches: branches.map((b) => b.name), tags: tags.map((t) => t.name) };
});

/**
 * URL GitHub-style /tree/<ref>/<path> ambigu kalau nama branch punya "/".
 * Cocokkan prefix terpanjang ke branch/tag, fallback ke segmen pertama (bisa SHA).
 */
export async function resolveRef(owner, repo, segments = [], fallback) {
  if (!segments.length) return { ref: fallback, path: "" };
  const segs = segments.map(decodeURIComponent);
  const { branches, tags } = await getRefs(owner, repo);
  const known = new Set([...branches, ...tags]);
  for (let i = segs.length; i > 0; i--) {
    const cand = segs.slice(0, i).join("/");
    if (known.has(cand)) return { ref: cand, path: segs.slice(i).join("/") };
  }
  return { ref: segs[0], path: segs.slice(1).join("/") };
}

export async function graphql(query, variables) {
  const s = await requireSession();
  const res = await fetch(`${API}/graphql`, {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${s.token}`, "Content-Type": "application/json", "User-Agent": "RepoHub" },
    body: JSON.stringify({ query, variables }),
  });
  const out = await res.json();
  if (!res.ok || out.errors) throw new GhError(res.status, out.errors?.[0]?.message || "GraphQL error");
  return out.data;
}
