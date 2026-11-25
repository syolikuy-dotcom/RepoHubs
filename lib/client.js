"use client";

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function call(base, path, { method = "GET", body, accept, signal } = {}) {
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      signal,
      credentials: "same-origin",
      headers: {
        "x-requested-with": "repohub",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(accept ? { "x-gh-accept": accept } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new ApiError(0, "Tidak bisa terhubung ke server. Cek koneksi internet.");
  }
  const text = res.status === 204 ? "" : await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    if (res.status === 401) { window.location.href = "/login"; }
    const msg = data?.message || data?.error?.message || `Request gagal (${res.status})`;
    throw new ApiError(res.status, res.status === 404 ? "Tidak ditemukan." : msg);
  }
  return data;
}

/** Panggil GitHub lewat proxy server: api("/repos/o/r/issues", {method, body}) */
export const api = (path, opts) => call("/api/gh", path, opts);
/** Panggil Vercel lewat proxy server */
export const vcApi = (path, opts) => call("/api/vc", path, opts);
export const post = (url, body) => call("", url, { method: "POST", body });

/** Antrian dengan batas konkurensi, supaya ratusan baris tidak menembak API sekaligus. */
export function createQueue(limit = 4) {
  let active = 0;
  const q = [];
  const next = () => {
    if (active >= limit || !q.length) return;
    active++;
    const { fn, resolve, reject } = q.shift();
    fn().then(resolve, reject).finally(() => { active--; next(); });
  };
  return (fn) => new Promise((resolve, reject) => { q.push({ fn, resolve, reject }); next(); });
}
