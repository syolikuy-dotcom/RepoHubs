import { NextResponse } from "next/server";
import { guard, json } from "@/lib/http";
import { getVercelSession } from "@/lib/session";
import { VcError, vcRequest } from "@/lib/vercel";

export const dynamic = "force-dynamic";

const ALLOWED = /^v\d+\/(projects|deployments|teams|user)(\/|$)/;

async function handle(req, { params }) {
  const session = await getVercelSession();
  if (!session) return json({ message: "Vercel belum terhubung." }, 401);
  const mutating = req.method !== "GET";
  if (mutating && !guard(req)) return json({ message: "Request ditolak." }, 403);

  const { path } = await params;
  if (path.some((s) => !s || s === "." || s === "..") || !ALLOWED.test(path.join("/"))) {
    return json({ message: "Endpoint tidak diizinkan." }, 400);
  }
  const body = mutating ? await req.json().catch(() => undefined) : undefined;
  try {
    const data = await vcRequest(
      session,
      `/${path.map(encodeURIComponent).join("/")}${new URL(req.url).search}`,
      { method: req.method, body },
    );
    return data === null ? new NextResponse(null, { status: 204 }) : json(data);
  } catch (e) {
    if (e instanceof VcError) return json({ message: e.message }, e.status);
    return json({ message: "Gagal menghubungi Vercel." }, 502);
  }
}

export { handle as GET, handle as POST, handle as DELETE };
