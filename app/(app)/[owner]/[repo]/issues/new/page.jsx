import { CirclePlus } from "lucide-react";
import { gh, getRepo, safe } from "@/lib/github";
import { PageTitle } from "@/components/ui/common";
import { NewIssueForm } from "@/components/repo/IssueTools";

export const metadata = { title: "Issue baru" };

export default async function NewIssue({ params }) {
  const { owner, repo } = await params;
  const r = await getRepo(owner, repo);
  const labels = await safe(gh(`/repos/${r.full_name}/labels?per_page=100`), []);
  return <div className="mw-860"><div className="page-head"><PageTitle icon={CirclePlus} small>Issue baru</PageTitle></div><NewIssueForm repo={r.full_name} labels={labels} /></div>;
}
