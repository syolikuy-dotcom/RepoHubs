import { getRefs, getRepo, resolveRef } from "@/lib/github";
import { requireSession } from "@/lib/session";
import UploadClient from "@/components/repo/UploadClient";
import { Flash } from "@/components/ui/common";

export const metadata = { title: "Upload" };

export default async function Upload({ params }) {
  const { owner, repo, rest } = await params;
  const s = await requireSession();
  const r = await getRepo(owner, repo);
  if (!r.permissions?.push) return <Flash type="warn">Kamu tidak punya akses tulis ke repository ini. Fork dulu untuk mengunggah perubahan.</Flash>;
  const { branches } = await getRefs(owner, repo);
  const { ref, path } = await resolveRef(owner, repo, rest || [], r.default_branch);
  return <UploadClient owner={owner} repo={repo} defaultBranch={r.default_branch} branches={branches} initialRef={ref} initialDir={path} login={s.user.login} empty={branches.length === 0} />;
}
