import { getRepo, resolveRef } from "@/lib/github";
import { requireSession } from "@/lib/session";
import FileEditor from "@/components/repo/FileEditor";

export const metadata = { title: "File baru" };

export default async function NewFile({ params }) {
  const { owner, repo, rest } = await params;
  const s = await requireSession();
  const r = await getRepo(owner, repo);
  const { ref, path } = await resolveRef(owner, repo, rest || [], r.default_branch);
  return <FileEditor owner={owner} repo={repo} mode="new" branch={ref} defaultBranch={r.default_branch} dir={path} login={s.user.login} canPush={!!r.permissions?.push} />;
}
