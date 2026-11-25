import Link from "next/link";
import { GitBranch, GitPullRequest } from "lucide-react";
import { gh, getRepo, graphql, safe } from "@/lib/github";
import { repoUrl, timeAgo } from "@/lib/utils";
import { Avatar, Empty, PageTitle } from "@/components/ui/common";
import { DeleteBranch, NewBranch } from "@/components/repo/BranchTools";

export const metadata = { title: "Branch" };

export default async function Branches({ params }) {
  const { owner, repo } = await params;
  const r = await getRepo(owner, repo);
  const canPush = !!r.permissions?.push;

  let rows = await safe((async () => {
    const d = await graphql(
      `query($o:String!,$n:String!){repository(owner:$o,name:$n){refs(refPrefix:"refs/heads/",first:100,orderBy:{field:TAG_COMMIT_DATE,direction:DESC}){nodes{name target{... on Commit{committedDate messageHeadline oid author{name user{login avatarUrl}}}}}}}}`,
      { o: owner, n: repo });
    return d.repository.refs.nodes.map((n) => ({ name: n.name, date: n.target?.committedDate, msg: n.target?.messageHeadline, sha: n.target?.oid, who: n.target?.author?.user?.login || n.target?.author?.name, avatar: n.target?.author?.user?.avatarUrl }));
  })(), null);
  const prot = new Map();
  const rest = await safe(gh(`/repos/${r.full_name}/branches?per_page=100`), []);
  rest.forEach((b) => prot.set(b.name, b.protected));
  if (!rows) rows = rest.map((b) => ({ name: b.name, sha: b.commit.sha }));
  const names = rows.map((b) => b.name);
  const sorted = [...rows].sort((a, b) => (a.name === r.default_branch ? -1 : b.name === r.default_branch ? 1 : 0));

  return (
    <div className="mw-1000">
      <div className="page-head"><PageTitle icon={GitBranch} small>Branch</PageTitle></div>
      {canPush && names.length > 0 && <NewBranch repo={r.full_name} branches={names} defaultBranch={r.default_branch} />}
      <div className="box">
        {!sorted.length && <Empty icon={GitBranch} title="Belum ada branch" />}
        {sorted.map((b) => (
          <div className="box-row" key={b.name} style={{ alignItems: "center" }}>
            <GitBranch size={16} className="icon muted" /><div className="grow">
              <div className="flex items-center gap-2 wrap"><Link href={repoUrl(owner, repo, "tree", b.name)} className="bold wrap-any">{b.name}</Link>
                {b.name === r.default_branch && <span className="pill brand">Default</span>}{prot.get(b.name) && <span className="pill warn">Protected</span>}</div>
              {(b.date || b.msg) && <div className="muted text-sm flex items-center gap-1 wrap mt-1">{b.avatar && <Avatar src={b.avatar} size={16} />}{b.who && <strong>{b.who}</strong>}{b.date && <span>diperbarui {timeAgo(b.date)}</span>}{b.msg && <span className="truncate" style={{ maxWidth: 360 }}>· {b.msg}</span>}</div>}
            </div>
            {b.name !== r.default_branch && <Link className="btn btn-sm" href={`/${r.full_name}/compare?base=${encodeURIComponent(r.default_branch)}&head=${encodeURIComponent(b.name)}`}><GitPullRequest size={14} className="icon" />Pull request baru</Link>}
            {canPush && b.name !== r.default_branch && !prot.get(b.name) && <DeleteBranch repo={r.full_name} name={b.name} />}
          </div>
        ))}
      </div>
    </div>
  );
}
