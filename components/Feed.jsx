"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleDot, FolderGit2, GitBranch, GitCommitHorizontal, GitFork, GitPullRequest, Globe, MessageSquare, Plus, Star, Tag, Trash2, UserPlus } from "lucide-react";
import { Avatar } from "./ui/common";
import { timeAgo } from "@/lib/utils";

const R = ({ name }) => <Link href={`/${name}`} className="bold">{name}</Link>;
const U = ({ name }) => <Link href={`/${name}`} className="bold fg-link">{name}</Link>;

function describe(ev) {
  const p = ev.payload || {};
  const repo = ev.repo.name;
  const actor = <U name={ev.actor.login} />;
  switch (ev.type) {
    case "PushEvent": {
      const branch = (p.ref || "").replace("refs/heads/", "");
      const n = p.size ?? p.commits?.length ?? 0;
      return {
        cat: "code",
        icon: GitCommitHorizontal,
        text: <>{actor} mendorong {n || ""} commit ke <Link href={`/${repo}/tree/${encodeURIComponent(branch)}`}>{branch}</Link> di <R name={repo} /></>,
        body: p.commits?.slice(-3).reverse().map((c) => (
          <div key={c.sha} className="truncate text-sm">
            <Link href={`/${repo}/commit/${c.sha}`} className="mono">{c.sha.slice(0, 7)}</Link>{" "}
            <span className="muted">{c.message.split("\n")[0]}</span>
          </div>
        )),
      };
    }
    case "CreateEvent":
      return { cat: "code", icon: p.ref_type === "tag" ? Tag : p.ref_type === "branch" ? GitBranch : Plus, text: <>{actor} membuat {p.ref_type} {p.ref && <code>{p.ref}</code>} di <R name={repo} /></> };
    case "DeleteEvent":
      return { cat: "code", icon: Trash2, text: <>{actor} menghapus {p.ref_type} <code>{p.ref}</code> di <R name={repo} /></> };
    case "WatchEvent":
      return { cat: "other", icon: Star, text: <>{actor} memberi bintang <R name={repo} /></> };
    case "ForkEvent":
      return { cat: "other", icon: GitFork, text: <>{actor} mem-fork <R name={repo} /> ke <R name={p.forkee?.full_name} /></> };
    case "PublicEvent":
      return { cat: "other", icon: Globe, text: <>{actor} membuka <R name={repo} /> menjadi public</> };
    case "MemberEvent":
      return { cat: "other", icon: UserPlus, text: <>{actor} menambahkan {p.member?.login} ke <R name={repo} /></> };
    case "ReleaseEvent":
      return { cat: "other", icon: Tag, text: <>{actor} merilis <Link href={`/${repo}/releases`}>{p.release?.name || p.release?.tag_name}</Link> di <R name={repo} /></> };
    case "IssuesEvent":
      return { cat: "issues", icon: CircleDot, text: <>{actor} {p.action} issue <Link href={`/${repo}/issues/${p.issue?.number}`}>#{p.issue?.number}</Link> di <R name={repo} /></>, body: <div className="muted text-sm truncate">{p.issue?.title}</div> };
    case "PullRequestEvent":
      return { cat: "issues", icon: GitPullRequest, text: <>{actor} {p.pull_request?.merged ? "me-merge" : p.action} pull request <Link href={`/${repo}/pull/${p.number}`}>#{p.number}</Link> di <R name={repo} /></>, body: <div className="muted text-sm truncate">{p.pull_request?.title}</div> };
    case "IssueCommentEvent":
      return { cat: "issues", icon: MessageSquare, text: <>{actor} berkomentar di <Link href={`/${repo}/issues/${p.issue?.number}`}>#{p.issue?.number}</Link> di <R name={repo} /></>, body: <div className="muted text-sm" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.comment?.body}</div> };
    default:
      return null;
  }
}

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "code", label: "Commit & Kode" },
  { id: "issues", label: "Issue & PR" },
  { id: "other", label: "Rilis & Bintang" },
];

export default function Feed({ events }) {
  const [filter, setFilter] = useState("all");
  const all = useMemo(() => events.map((ev) => ({ ev, d: describe(ev) })).filter((x) => x.d), [events]);
  const items = useMemo(() => (filter === "all" ? all : all.filter((x) => x.d.cat === filter)), [all, filter]);

  if (!all.length) {
    return (
      <div className="box">
        <div className="blank compact">
          <span className="blank-ico"><FolderGit2 size={28} aria-hidden="true" /></span>
          <h3>Belum ada aktivitas</h3>
          <p>Aktivitas push, pull request, dan rilis dari akun yang kamu ikuti akan tampil di sini.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center between wrap gap-2 mb-3">
        <span className="muted text-sm tabular">{items.length} aktivitas</span>
        <div className="seg-tabs" role="tablist" aria-label="Filter aktivitas">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`seg-tab${filter === f.id ? " active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!items.length ? (
        <div className="box">
          <div className="blank compact">
            <span className="blank-ico"><FolderGit2 size={28} aria-hidden="true" /></span>
            <p>Tidak ada aktivitas di kategori ini.</p>
          </div>
        </div>
      ) : (
        items.map(({ ev, d }) => (
          <article className="feed-card" key={ev.id}>
            <div className="feed-card-head">
              <div className="ev-avatar">
                <Avatar src={ev.actor.avatar_url} size={32} />
                <span className="ev-badge"><d.icon aria-hidden="true" /></span>
              </div>
              <div className="grow">
                <div className="wrap-any">
                  {d.text} <span className="muted text-sm">· {timeAgo(ev.created_at)}</span>
                </div>
                {d.body && (
                  <div className="box box-body mt-2" style={{ padding: "8px 12px", background: "var(--bg-subtle)" }}>
                    {d.body}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
