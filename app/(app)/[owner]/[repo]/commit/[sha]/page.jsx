import Link from "next/link";
import { Code } from "lucide-react";
import { gh, getRepo, orNotFound } from "@/lib/github";
import { timeAgo, repoUrl } from "@/lib/utils";
import { Avatar } from "@/components/ui/common";
import CopyButton from "@/components/ui/CopyButton";
import Diff from "@/components/repo/Diff";

export async function generateMetadata({ params }) { return { title: `Commit ${(await params).sha.slice(0, 7)}` }; }

export default async function CommitPage({ params }) {
  const { owner, repo, sha } = await params;
  const r = await getRepo(owner, repo);
  const c = await orNotFound(gh(`/repos/${r.full_name}/commits/${encodeURIComponent(sha)}`));
  const [title, ...rest] = c.commit.message.split("\n");
  return (
    <div>
      <div className="box mb-3">
        <div className="box-body">
          <h1 style={{ fontSize: 20, fontWeight: 600 }} className="wrap-any">{title}</h1>
          {rest.join("\n").trim() && <pre className="wrap-any" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: "12px 0 0", color: "var(--fg-muted)" }}>{rest.join("\n").trim()}</pre>}
        </div>
        <div className="box-header" style={{ borderTop: "1px solid var(--border)", borderBottom: 0 }}>
          <Avatar src={c.author?.avatar_url} size={20} />
          <span><strong>{c.author?.login || c.commit.author?.name}</strong> <span className="muted">melakukan commit {timeAgo(c.commit.author?.date)}</span></span>
          <span className="grow" />
          {c.parents.map((p) => <span key={p.sha} className="text-sm muted">induk <Link className="mono" href={`/${r.full_name}/commit/${p.sha}`}>{p.sha.slice(0, 7)}</Link></span>)}
          <span className="text-sm muted">commit <span className="mono" style={{ color: "var(--fg)" }}>{c.sha.slice(0, 7)}</span></span>
          <CopyButton text={c.sha} label="Salin SHA" /><Link href={repoUrl(owner, repo, "tree", c.sha)} className="btn btn-sm"><Code size={14} className="icon" />Jelajahi kode</Link>
        </div>
      </div>
      <p className="muted">Menampilkan <strong>{c.files?.length || 0} file</strong> dengan <span className="add-t">{c.stats?.additions} penambahan</span> dan <span className="del-t">{c.stats?.deletions} penghapusan</span>.</p>
      <Diff files={c.files} />
    </div>
  );
}
