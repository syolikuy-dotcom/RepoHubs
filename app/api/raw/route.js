import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const TYPES = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
  avif: "image/avif", ico: "image/x-icon", bmp: "image/bmp", svg: "image/svg+xml", pdf: "application/pdf",
  mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", wav: "audio/wav",
};
const TEXTLIKE = new Set(["html", "htm", "xhtml", "xml", "js", "mjs", "css", "json", "md", "txt"]);

/** GET /api/raw?repo=owner/name&ref=main&path=a/b.png[&download=1] — stream file dengan token sesi. */
export async function GET(req) {
  const session = await getSession();
  if (!session) return new Response("Belum login", { status: 401 });
  const q = new URL(req.url).searchParams;
  const repo = q.get("repo") || "";
  const ref = q.get("ref") || "";
  const path = q.get("path") || "";
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !path || path.split("/").some((s) => s === ".." || s === "")) {
    return new Response("Parameter tidak valid", { status: 400 });
  }
  const url = `https://api.github.com/repos/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${session.token}`, Accept: "application/vnd.github.raw+json", "User-Agent": "RepoHub" },
  });
  if (!res.ok) return new Response(res.status === 404 ? "Tidak ditemukan" : "Gagal mengambil file", { status: res.status });

  const name = path.split("/").pop();
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  const download = q.get("download") === "1";
  const type = TYPES[ext] || (TEXTLIKE.has(ext) ? "text/plain; charset=utf-8" : "application/octet-stream");
  return new Response(res.body, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `${download || type === "application/octet-stream" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
      // SVG/PDF dari repo orang lain tidak boleh menjalankan script di origin kita.
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline'",
    },
  });
}
