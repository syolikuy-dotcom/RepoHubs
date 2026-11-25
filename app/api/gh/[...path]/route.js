import { NextResponse } from "next/server";
import { GH_ACCEPT, guard, json } from "@/lib/http";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Hanya endpoint yang dipakai RepoHub. Endpoint sensitif (authorizations, app, dll) tidak diteruskan.
const ALLOWED = new Set([
  "repos", "user", "users", "orgs", "search", "gists", "notifications",
  "rate_limit", "issues", "gitignore", "licenses",
]);
const MAX_BODY = 4_400_000; // batas body serverless Vercel ~4.5MB
const PASS = ["link", "x-ratelimit-remaining", "x-ratelimit-reset", "x-oauth-scopes"];

async function handle(req, { params }) {
  const session = await getSession();
  if (!session) return json({ message: "Belum login" }, 401);

  const mutating = !["GET", "HEAD"].includes(req.method);
  if (mutating && !guard(req)) return json({ message: "Request ditolak." }, 403);

  const { path } = await params;
  if (!path?.length || !ALLOWED.has(path[0]) || path.some((s) => !s || s === "." || s === "..")) {
    return json({ message: "Endpoint tidak diizinkan." }, 400);
  }

  let body;
  if (mutating) {
    body = await req.text();
    if (body.length > MAX_BODY) return json({ message: "Body terlalu besar (maks ~4MB per request)." }, 413);
  }

  const accept = req.headers.get("x-gh-accept");
  const url = `https://api.github.com/${path.map(encodeURIComponent).join("/")}${new URL(req.url).search}`;
  let res;
  try {
    res = await fetch(url, {
      method: req.method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${session.token}`,
        Accept: accept && GH_ACCEPT.test(accept) ? accept : "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "RepoHub",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body || undefined,
    });
  } catch {
    return json({ message: "Tidak bisa menghubungi GitHub." }, 502);
  }

  const headers = new Headers({ "content-type": res.headers.get("content-type") || "application/json", "cache-control": "no-store" });
  for (const h of PASS) if (res.headers.get(h)) headers.set(h, res.headers.get(h));
  const text = [204, 205, 304].includes(res.status) ? null : await res.text();
  return new NextResponse(text, { status: res.status, headers });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
