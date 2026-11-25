import Link from "next/link";
import { GitFork, Scale, Star } from "lucide-react";
import { fmtNum, langColor, timeAgo } from "@/lib/utils";
import { VisBadge } from "./ui/common";

export function RepoItem({ repo, showOwner = true }) {
  return (
    <div className="box-row" style={{ flexDirection: "column", gap: 6 }}>
      <div className="flex items-center gap-2 wrap">
        <Link href={`/${repo.full_name}`} className="bold wrap-any" style={{ fontSize: 18 }}>{showOwner ? repo.full_name : repo.name}</Link>
        <VisBadge isPrivate={repo.private} />
        {repo.fork && <span className="pill">Fork</span>}
        {repo.archived && <span className="pill warn">Archived</span>}
      </div>
      {repo.description && <p className="muted wrap-any" style={{ margin: 0 }}>{repo.description}</p>}
      {repo.topics?.length > 0 && (
        <div className="flex wrap gap-1">{repo.topics.slice(0, 6).map((t) => <Link key={t} className="topic" href={`/search?type=repositories&q=topic:${encodeURIComponent(t)}`}>{t}</Link>)}</div>
      )}
      <div className="flex wrap gap-3 muted text-sm items-center">
        {repo.language && <span><span className="lang-dot" style={{ background: langColor(repo.language) }} />{repo.language}</span>}
        {repo.stargazers_count > 0 && <span className="flex items-center gap-1"><Star size={14} className="icon" />{fmtNum(repo.stargazers_count)}</span>}
        {repo.forks_count > 0 && <span className="flex items-center gap-1"><GitFork size={14} className="icon" />{fmtNum(repo.forks_count)}</span>}
        {repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION" && <span className="flex items-center gap-1"><Scale size={14} className="icon" />{repo.license.spdx_id}</span>}
        <span>Diperbarui {timeAgo(repo.pushed_at || repo.updated_at)}</span>
      </div>
    </div>
  );
}

export function RepoList({ repos, showOwner = true }) {
  return <div className="box">{repos.map((r) => <RepoItem key={r.id} repo={r} showOwner={showOwner} />)}</div>;
}
