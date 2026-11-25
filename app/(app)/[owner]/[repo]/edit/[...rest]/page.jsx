import { notFound, redirect } from "next/navigation";
import { gh, getRepo, orNotFound, resolveRef } from "@/lib/github";
import { requireSession } from "@/lib/session";
import { encPath, repoUrl } from "@/lib/utils";
import FileEditor from "@/components/repo/FileEditor";
import { Flash } from "@/components/ui/common";

export const metadata = { title: "Edit file" };

export default async function EditFile({ params }) {
  const { owner, repo, rest } = await params;
  const s = await requireSession();
  const r = await getRepo(owner, repo);
  const { ref, path } = await resolveRef(owner, repo, rest, r.default_branch);
  if (!path) notFound();
  const file = await orNotFound(gh(`/repos/${r.full_name}/contents/${encPath(path)}?ref=${encodeURIComponent(ref)}`));
  if (Array.isArray(file)) redirect(repoUrl(owner, repo, "tree", ref, path));
  const raw = file.encoding === "base64" && file.content
    ? Buffer.from(file.content, "base64")
    : Buffer.from(await gh(`/repos/${r.full_name}/contents/${encPath(path)}?ref=${encodeURIComponent(ref)}`, { accept: "application/vnd.github.raw+json", text: true }));
  if (raw.subarray(0, 8000).includes(0) || raw.length > 1_000_000) {
    return <Flash type="warn">File ini biner atau lebih dari 1MB, jadi tidak bisa diedit di browser. Gunakan halaman Upload untuk menggantinya.</Flash>;
  }
  return <FileEditor owner={owner} repo={repo} mode="edit" branch={ref} defaultBranch={r.default_branch} path={path} initial={raw.toString("utf8")} login={s.user.login} canPush={!!r.permissions?.push} />;
}
