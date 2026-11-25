import Link from "next/link";
import { CircleCheck, GitMerge, GitPullRequest, Plus, Search } from "lucide-react";
import { gh, getRepo } from "@/lib/github";
import { Pager, SearchField, StateTabs, one, pageNum } from "@/components/ui/common";
import IssueList from "@/components/repo/IssueList";

export const metadata = { title: "Pull request" };
const STATES = { open: "is:open", merged: "is:merged", closed: "is:closed is:unmerged" };
const LABELS = { open: "Terbuka", merged: "Merged", closed: "Ditutup" };
const ICONS = { open: GitPullRequest, merged: GitMerge, closed: CircleCheck };

export default async function Pulls({ params, searchParams }) {
  const { owner, repo } = await params;
  const sp = await searchParams;
  const r = await getRepo(owner, repo);
  const state = STATES[one(sp.state)] ? one(sp.state) : "open";
  const text = (one(sp.q) || "").trim().slice(0, 200);
  const page = pageNum(sp.page);
  const res = await gh(`/search/issues?q=${encodeURIComponent(`repo:${r.full_name} is:pr ${STATES[state]} ${text}`.trim())}&sort=created&order=desc&per_page=25&page=${page}`);
  const items = res.items.map((i) => ({ ...i, __repo: r.full_name }));
  return (
    <div>
      <form className="toolbar" action={`/${r.full_name}/pulls`}>
        <input type="hidden" name="state" value={state} />
        <SearchField className="grow" style={{ minWidth: 180 }} name="q" defaultValue={text} placeholder="Cari pull request…" label="Cari pull request" />
        <button className="btn"><Search size={14} className="icon" />Cari</button>
        <Link href={`/${r.full_name}/compare`} className="btn btn-primary"><Plus size={14} className="icon" />Pull request baru</Link>
      </form>
      <div className="box">
        <div className="box-header"><StateTabs items={Object.entries(LABELS).map(([k, v]) => ({ href: `/${r.full_name}/pulls?state=${k}${text ? `&q=${encodeURIComponent(text)}` : ""}`, label: v, icon: ICONS[k], active: state === k }))} /><span className="grow" /><span className="muted text-sm">{res.total_count} hasil</span></div>
        <IssueList items={items} emptyTitle="Tidak ada pull request" />
      </div>
      <Pager base={`/${r.full_name}/pulls`} params={{ state, q: text }} page={page} hasNext={res.total_count > page * 25} />
    </div>
  );
}
