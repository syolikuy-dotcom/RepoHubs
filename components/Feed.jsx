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
      return { icon: GitCommitHorizontal, text: <>{actor} mendorong {n || ""} commit ke <Link href={`/${repo}/tree/${encodeURIComponent(branch)}`}>{branch}</Link> di <R name={repo} /></>,
        body: p.commits?.slice(-3).reverse().map((c) => <div key={c.sha} className="truncate text-sm"><Link href={`/${repo}/commit/${c.sha}`} className="mono">{c.sha.slice(0, 7)}</Link> <span className="muted">{c.message.split("\n")[0]}</span></div>) };
    }
    case "CreateEvent": return { icon: p.ref_type === "tag" ? Tag : p.ref_type === "branch" ? GitBranch : Plus, text: <>{actor} membuat {p.ref_type} {p.ref && <code>{p.ref}</code>} di <R name={repo} /></> };
    case "DeleteEvent": return { icon: Trash2, text: <>{actor} menghapus {p.ref_type} <code>{p.ref}</code> di <R name={repo} /></> };
    case "WatchEvent": return { icon: Star, text: <>{actor} memberi bintang <R name={repo} /></> };
    case "ForkEvent": return { icon: GitFork, text: <>{actor} mem-fork <R name={repo} /> ke <R name={p.forkee?.full_name} /></> };
    case "PublicEvent": return { icon: Globe, text: <>{actor} membuka <R name={repo} /> menjadi public</> };
    case "MemberEvent": return { icon: UserPlus, text: <>{actor} menambahkan {p.member?.login} ke <R name={repo} /></> };
    case "ReleaseEvent": return { icon: Tag, text: <>{actor} merilis <Link href={`/${repo}/releases`}>{p.release?.name || p.release?.tag_name}</Link> di <R name={repo} /></> };
    case "IssuesEvent": return { icon: CircleDot, text: <>{actor} {p.action} issue <Link href={`/${repo}/issues/${p.issue?.number}`}>#{p.issue?.number}</Link> di <R name={repo} /></>, body: <div className="muted text-sm truncate">{p.issue?.title}</div> };
    case "PullRequestEvent": return { icon: GitPullRequest, text: <>{actor} {p.pull_request?.merged ? "me-merge" : p.action} pull request <Link href={`/${repo}/pull/${p.number}`}>#{p.number}</Link> di <R name={repo} /></>, body: <div className="muted text-sm truncate">{p.pull_request?.title}</div> };
    case "IssueCommentEvent": return { icon: MessageSquare, text: <>{actor} berkomentar di <Link href={`/${repo}/issues/${p.issue?.number}`}>#{p.issue?.number}</Link> di <R name={repo} /></>, body: <div className="muted text-sm" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.comment?.body}</div> };
    default: return null;
  }
}

export default function Feed({ events }) {
  const items = events.map((ev) => ({ ev, d: describe(ev) })).filter((x) => x.d);
  if (!items.length) return <div className="blank compact"><span className="blank-ico"><FolderGit2 size={32} aria-hidden="true" /></span><p>Belum ada aktivitas terbaru dari akun yang kamu ikuti.</p></div>;
  return (
    <div>
      {items.map(({ ev, d }) => (
        <div className="event" key={ev.id}>
          <div className="ev-avatar">
            <Avatar src={ev.actor.avatar_url} size={32} />
            <span className="ev-badge"><d.icon aria-hidden="true" /></span>
          </div>
          <div className="grow">
            <div className="wrap-any">{d.text} <span className="muted text-sm">· {timeAgo(ev.created_at)}</span></div>
            {d.body && <div className="box box-body mt-2" style={{ padding: "8px 12px", background: "var(--bg-subtle)" }}>{d.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
