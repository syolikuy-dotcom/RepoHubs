import { getRepo, resolveRef } from "@/lib/github";
import Browser from "@/components/repo/Browser";

export default async function Tree({ params }) {
  const { owner, repo, rest } = await params;
  const r = await getRepo(owner, repo);
  const { ref, path } = await resolveRef(owner, repo, rest, r.default_branch);
  return <Browser r={r} refName={ref} path={path} />;
}
