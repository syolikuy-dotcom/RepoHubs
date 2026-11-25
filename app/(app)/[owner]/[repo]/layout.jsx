import Link from "next/link";
import { gh, ghStatus, getRepo, safe } from "@/lib/github";
import { Avatar, VisBadge } from "@/components/ui/common";
import FileFinder from "@/components/repo/FileFinder";
import { ForkButton, RepoTabs, StarButton, WatchButton } from "@/components/repo/RepoChrome";

export async function generateMetadata({ params }) {
  const { owner, repo } = await params;
  return { title: `${owner}/${repo}` };
}

export default async function RepoLayout({ children, params }) {
  const { owner, repo } = await params;
  const r = await getRepo(owner, repo);
  const [star, watch, prs] = await Promise.all([
    ghStatus(`/user/starred/${r.full_name}`),
    ghStatus(`/repos/${r.full_name}/subscription`),
    safe(gh(`/search/issues?q=${encodeURIComponent(`repo:${r.full_name} is:pr is:open`)}&per_page=1`), null),
  ]);
  const prCount = prs?.total_count ?? 0;
  const base = `/${r.full_name}`;
  return (
    <>
      <div className="repohead">
        <div className="container">
          <div className="flex between wrap gap-3">
            <div className="repo-title">
              <Avatar src={r.owner.avatar_url} size={20} />
              <Link href={`/${r.owner.login}`}>{r.owner.login}</Link><span className="sep">/</span>
              <Link href={base} className="name wrap-any">{r.name}</Link>
              <VisBadge isPrivate={r.private} />
              {r.archived && <span className="pill warn">Archived</span>}
            </div>
            <div className="flex gap-2 wrap">
              <WatchButton repo={r.full_name} watching={watch === 200} count={r.subscribers_count ?? r.watchers_count} />
              <ForkButton repo={r.full_name} count={r.forks_count} />
              <StarButton repo={r.full_name} starred={star === 204} count={r.stargazers_count} />
            </div>
          </div>
          {r.fork && r.parent && <div className="muted text-sm mt-1">forked dari <Link href={`/${r.parent.full_name}`}>{r.parent.full_name}</Link></div>}
          <RepoTabs base={base} issues={Math.max(0, r.open_issues_count - prCount)} pulls={prCount} admin={!!r.permissions?.admin} />
        </div>
      </div>
      <div className="container page">{children}</div>
      <FileFinder owner={r.owner.login} repo={r.name} defaultBranch={r.default_branch} />
    </>
  );
}
