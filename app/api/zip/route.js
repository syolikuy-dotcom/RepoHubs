import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/zip?repo=owner/name&ref=main — stream zipball (tanpa batas 4.5MB karena response streaming). */
export async function GET(req) {
  const session = await getSession();
  if (!session) return new Response("Belum login", { status: 401 });
  const q = new URL(req.url).searchParams;
  const repo = q.get("repo") || "";
  const ref = q.get("ref") || "";
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^[\w./@-]{1,200}$/.test(ref) || ref.includes("..")) return new Response("Parameter tidak valid", { status: 400 });
  const res = await fetch(`https://api.github.com/repos/${repo}/zipball/${ref.split("/").map(encodeURIComponent).join("/")}`, {
    cache: "no-store", redirect: "follow",
    headers: { Authorization: `Bearer ${session.token}`, Accept: "application/vnd.github+json", "User-Agent": "RepoHub" },
  });
  if (!res.ok || !res.body) return new Response(res.status === 404 ? "Tidak ditemukan" : "Gagal mengunduh", { status: res.status || 502 });
  return new Response(res.body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${repo.split("/")[1]}-${ref.replace(/[^\w.-]/g, "-")}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
