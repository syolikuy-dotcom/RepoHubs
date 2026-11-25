import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageSquare, Milestone, Tag, UserCheck } from "lucide-react";
import { gh, getRepo, orNotFound, safe } from "@/lib/github";
import { StateBadge } from "@/components/ui/common";
import { Thread } from "@/components/repo/Thread";
import { CommentForm, LabelsEditor } from "@/components/repo/IssueTools";
import { timeAgo } from "@/lib/utils";

export async function generateMetadata({ params }) { return { title: `Issue #${(await params).number}` }; }

export default async function IssuePage({ params }) {
  const { owner, repo, number } = await params;
  if (!/^\d+$/.test(number)) notFound();
  const r = await getRepo(owner, repo);
  const issue = await orNotFound(gh(`/repos/${r.full_name}/issues/${number}`));
  if (issue.pull_request) redirect(`/${r.full_name}/pull/${number}`);
  const [comments, all] = await Promise.all([
    gh(`/repos/${r.full_name}/issues/${number}/comments?per_page=100`),
    safe(gh(`/repos/${r.full_name}/labels?per_page=100`), []),
  ]);
  const canEdit = !!r.permissions?.push;
  return (
    <div>
      <h1 className="issue-title"><span className="wrap-any">{issue.title}</span><span className="num">#{issue.number}</span></h1>
      <div className="flex items-center gap-2 wrap mt-2 mb-3" style={{ paddingBottom: 16, borderBottom: "1px solid var(--border-muted)" }}>
        <StateBadge issue={issue} />
        <span className="muted"><Link href={`/${issue.user.login}`} className="bold muted">{issue.user.login}</Link> membuka issue ini {timeAgo(issue.created_at)} · <span className="meta"><MessageSquare size={13} aria-hidden="true" />{issue.comments} komentar</span></span>
      </div>
      <div className="layout layout-main-side">
        <div style={{ minWidth: 0 }}>
          <Thread issue={issue} comments={comments} ctx={{ owner, repo, ref: r.default_branch, dir: "" }} />
          <CommentForm repo={r.full_name} number={issue.number} state={issue.state} />
        </div>
        <aside className="meta-side">
          <div><h4><UserCheck size={14} aria-hidden="true" />Penerima tugas</h4>{issue.assignees?.length ? issue.assignees.map((a) => <div key={a.id}><Link href={`/${a.login}`}>{a.login}</Link></div>) : <span className="muted text-sm">Belum ada</span>}</div>
          <div><h4><Tag size={14} aria-hidden="true" />Label</h4><LabelsEditor repo={r.full_name} number={issue.number} labels={issue.labels} all={all} canEdit={canEdit} /></div>
          <div><h4><Milestone size={14} aria-hidden="true" />Milestone</h4>{issue.milestone ? issue.milestone.title : <span className="muted text-sm">Belum ada</span>}</div>
        </aside>
      </div>
    </div>
  );
}
