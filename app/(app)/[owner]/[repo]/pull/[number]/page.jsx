import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, CircleX, FileDiff, GitCommitHorizontal, LoaderCircle, MessageSquare, Tag, UserCheck } from "lucide-react";
import { gh, getRepo, orNotFound, safe } from "@/lib/github";
import { Avatar, Flash, StateBadge, one } from "@/components/ui/common";
import { Thread } from "@/components/repo/Thread";
import { CommentForm, LabelsEditor, MergeBox } from "@/components/repo/IssueTools";
import Diff from "@/components/repo/Diff";
import { timeAgo } from "@/lib/utils";

export async function generateMetadata({ params }) { return { title: `Pull request #${(await params).number}` }; }

export default async function PullPage({ params, searchParams }) {
  const { owner, repo, number } = await params;
  if (!/^\d+$/.test(number)) notFound();
  const tab = ["commits", "files"].includes(one((await searchParams).tab)) ? one((await searchParams).tab) : "conversation";
  const r = await getRepo(owner, repo);
  const base = `/repos/${r.full_name}`;
  const pr = await orNotFound(gh(`${base}/pulls/${number}`));
  const [comments, labels, checks, commits, files] = await Promise.all([
    tab === "conversation" ? gh(`${base}/issues/${number}/comments?per_page=100`) : [],
    tab === "conversation" ? safe(gh(`${base}/labels?per_page=100`), []) : [],
    tab === "conversation" ? safe(gh(`${base}/commits/${pr.head.sha}/check-runs?per_page=100`), null) : null,
    tab === "commits" ? gh(`${base}/pulls/${number}/commits?per_page=100`) : [],
    tab === "files" ? gh(`${base}/pulls/${number}/files?per_page=100`) : [],
  ]);
  const merged = !!pr.merged;
  const issueLike = { ...pr, merged };
  const runs = checks?.check_runs || [];
  const failed = runs.filter((c) => ["failure", "timed_out", "cancelled"].includes(c.conclusion)).length;
  const pending = runs.filter((c) => c.status !== "completed").length;
  const href = (t) => `/${r.full_name}/pull/${number}${t === "conversation" ? "" : `?tab=${t}`}`;
  const sameRepo = pr.head.repo?.full_name === r.full_name;

  return (
    <div>
      <h1 className="issue-title"><span className="wrap-any">{pr.title}</span><span className="num">#{pr.number}</span></h1>
      <div className="flex items-center gap-2 wrap mt-2">
        <StateBadge issue={issueLike} />
        <span className="muted wrap-any"><strong>{pr.user.login}</strong> ingin me-merge {pr.commits} commit dari <code>{pr.head.label}</code> ke <code>{pr.base.ref}</code> · {timeAgo(pr.created_at)}</span>
      </div>
      <div className="tabnav bordered mt-3">
        {[["conversation", "Percakapan", pr.comments, MessageSquare], ["commits", "Commit", pr.commits, GitCommitHorizontal], ["files", "File berubah", pr.changed_files, FileDiff]].map(([k, l, n, I]) => (
          <Link key={k} href={href(k)} className={`tab ${tab === k ? "active" : ""}`} aria-current={tab === k ? "page" : undefined}><I size={16} className="icon" aria-hidden="true" />{l}<span className="counter">{n}</span></Link>
        ))}
      </div>

      {tab === "conversation" && (
        <div className="layout layout-main-side">
          <div style={{ minWidth: 0 }}>
            <Thread issue={pr} comments={comments} ctx={{ owner, repo, ref: pr.base.ref, dir: "" }} />
            {merged ? <Flash type="done">Pull request ini sudah di-merge {timeAgo(pr.merged_at)} oleh {pr.merged_by?.login}.</Flash>
              : pr.state === "open" && (
                <>
                  {runs.length > 0 && (
                    <div className="box mb-3"><div className="box-body flex items-center gap-2">
                      {failed ? <CircleX size={18} style={{ color: "var(--danger)" }} /> : pending ? <LoaderCircle size={18} className="spin" style={{ color: "var(--attention)" }} /> : <CircleCheck size={18} style={{ color: "var(--success)" }} />}
                      <strong>{failed ? `${failed} check gagal` : pending ? `${pending} check berjalan` : "Semua check lulus"}</strong><span className="muted">dari {runs.length} check</span></div></div>
                  )}
                  <MergeBox repo={r.full_name} pr={pr} allow={{ merge: r.allow_merge_commit, squash: r.allow_squash_merge, rebase: r.allow_rebase_merge }} canPush={!!r.permissions?.push} sameRepo={sameRepo} />
                </>
              )}
            <CommentForm repo={r.full_name} number={pr.number} state={pr.state} isPR merged={merged} />
          </div>
          <aside className="meta-side">
            <div><h4><UserCheck size={14} aria-hidden="true" />Reviewer</h4>{pr.requested_reviewers?.length ? pr.requested_reviewers.map((u) => <div key={u.id} className="flex items-center gap-2"><Avatar src={u.avatar_url} size={20} />{u.login}</div>) : <span className="muted text-sm">Belum ada</span>}</div>
            <div><h4><Tag size={14} aria-hidden="true" />Label</h4><LabelsEditor repo={r.full_name} number={pr.number} labels={pr.labels} all={labels} canEdit={!!r.permissions?.push} /></div>
            <div><h4><FileDiff size={14} aria-hidden="true" />Perubahan</h4><span className="add-t">+{pr.additions}</span> <span className="del-t">-{pr.deletions}</span> <span className="muted">di {pr.changed_files} file</span></div>
          </aside>
        </div>
      )}

      {tab === "commits" && (
        <div className="box">{commits.map((c) => (
          <div className="box-row" key={c.sha} style={{ alignItems: "center" }}>
            <div className="grow wrap-any"><Link href={`/${r.full_name}/commit/${c.sha}`} className="bold" style={{ color: "var(--fg)" }}>{c.commit.message.split("\n")[0]}</Link><div className="muted text-sm">{c.author?.login || c.commit.author?.name} · {timeAgo(c.commit.author?.date)}</div></div>
            <Link className="btn btn-sm mono" href={`/${r.full_name}/commit/${c.sha}`}>{c.sha.slice(0, 7)}</Link>
          </div>))}</div>
      )}
      {tab === "files" && <Diff files={files} />}
    </div>
  );
}
