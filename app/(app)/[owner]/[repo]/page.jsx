import { getRepo } from "@/lib/github";
import Browser from "@/components/repo/Browser";

export default async function RepoHome({ params }) {
  const { owner, repo } = await params;
  const r = await getRepo(owner, repo);
  return <Browser r={r} refName="" path="" />;
}
