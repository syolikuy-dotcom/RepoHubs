import Link from "next/link";
import { AtSign, CircleCheck, CircleDot, Eye, GitPullRequest, Pencil, UserCheck } from "lucide-react";
import { gh } from "@/lib/github";
import IssueList from "@/components/repo/IssueList";
import { PageTitle, Pager, StateTabs, one, pageNum } from "@/components/ui/common";

const WHO_ICON = { author: Pencil, assignee: UserCheck, mentions: AtSign, review: Eye };
const WHO = { author: "Dibuat oleh saya", assignee: "Ditugaskan ke saya", mentions: "Menyebut saya", review: "Perlu review saya" };

export default async function GlobalIssues({ kind, searchParams, base }) {
  const sp = await searchParams;
  const keys = kind === "pr" ? Object.keys(WHO) : Object.keys(WHO).filter((k) => k !== "review");
  const who = keys.includes(one(sp.who)) ? one(sp.who) : "author";
  const state = one(sp.state) === "closed" ? "closed" : "open";
  const page = pageNum(sp.page);
  const qual = who === "review" ? "review-requested:@me" : `${who}:@me`;
  const res = await gh(`/search/issues?q=${encodeURIComponent(`is:${kind === "pr" ? "pr" : "issue"} is:${state} ${qual} archived:false`)}&sort=updated&order=desc&per_page=25&page=${page}`);
  const href = (w, s) => `${base}?who=${w}&state=${s}`;
  return (
    <div className="container page mw-1000">
      <div className="page-head"><PageTitle icon={kind === "pr" ? GitPullRequest : CircleDot}>{kind === "pr" ? "Pull request" : "Issue"}</PageTitle></div>
      <div className="subnav">{keys.map((k) => { const I = WHO_ICON[k]; return <Link key={k} href={href(k, state)} className={`btn ${who === k ? "btn-primary" : ""}`}><I size={14} className="icon" />{WHO[k]}</Link>; })}</div>
      <div className="box">
        <div className="box-header"><StateTabs items={[{ href: href(who, "open"), label: "Terbuka", icon: CircleDot, active: state === "open" }, { href: href(who, "closed"), label: "Ditutup", icon: CircleCheck, active: state === "closed" }]} /><span className="grow" /><span className="muted text-sm">{res.total_count} hasil</span></div>
        <IssueList items={res.items} showRepo emptyTitle="Tidak ada yang cocok" />
      </div>
      <Pager base={base} params={{ who, state }} page={page} hasNext={res.total_count > page * 25} />
    </div>
  );
}
