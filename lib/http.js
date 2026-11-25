import "server-only";
import { NextResponse } from "next/server";

export const json = (data, status = 200, headers) => NextResponse.json(data, { status, headers });

/** Tolak request mutasi yang bukan dari origin kita sendiri (CSRF). */
export function guard(req) {
  if (req.headers.get("x-requested-with") !== "repohub") return false;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const hits = new Map();
/** Limiter sederhana per-instance (best effort di serverless). */
export function rateLimit(key, max = 10, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length <= max;
}

export function clientIp(req) {
  return (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
}

export const GH_ACCEPT = /^application\/vnd\.github(\.[a-z0-9.+-]+)?$/i;
