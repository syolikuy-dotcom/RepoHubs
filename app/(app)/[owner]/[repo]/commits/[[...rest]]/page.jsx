import Link from "next/link";
import { Code, GitCommitHorizontal, MessageSquare } from "lucide-react";
import { ghPage, getRepo, resolveRef } from "@/lib/github";
import { encPath, repoUrl } from "@/lib/utils";
import { Avatar, Empty, PageTitle, Pager, pageNum } from "@/components/ui/common";
import { BranchSelect } from "@/components/repo/BrowserBits";

export const metadata = { title: "Riwayat commit" };

export default async function Commits({ params, searchParams }) {
  const { owner, repo, rest } = await params;
  const sp = await searchParams;
  const page = pageNum(sp.page);
  const r = await getRepo(owner, repo);
  const { ref, path } = await resolveRef(owner, repo, rest || [], r.default_branch);
  const { data, next } = await ghPage(`/repos/${r.full_name}/commits?sha=${encodeURIComponent(ref)}&per_page=30&page=${page}${path ? `&path=${encodeURIComponent(path)}` : ""}`);

  const groups = [];
  for (const c of data) {
    const day = new Date(c.commit.author?.date || c.commit.committer?.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(c); else groups.push({ day, items: [c] });
  }

  return (
    <div className="mw-1000">
      <div className="toolbar">
        <BranchSelect owner={owner} repo={repo} current={ref} kind="commits" path={path} />
        <PageTitle icon={GitCommitHorizontal} small>Riwayat commit{path && <span className="muted wrap-any" style={{ fontWeight: 400 }}> · {path}</span>}</PageTitle>
      </div>
      {!data.length ? <div className="box"><Empty icon={GitCommitHorizontal} title="Belum ada commit" /></div> : groups.map((g) => (
        <section key={g.day} className="mb-3">
          <h2 className="muted" style={{ fontSize: 14, fontWeight: 400, marginBottom: 8 }}>Commit pada {g.day}</h2>
          <div className="box">
            {g.items.map((c) => {
              const [title, ...body] = c.commit.message.split("\n");
              return (
                <div className="box-row" key={c.sha} style={{ alignItems: "center" }}>
                  <div className="grow">
                    <Link href={`/${r.full_name}/commit/${c.sha}`} className="bold wrap-any fg-link">{title}</Link>
                    {body.join("").trim() && <span className="pill" style={{ marginLeft: 6 }} title="Ada deskripsi commit"><MessageSquare size={12} aria-hidden="true" /></span>}
                    <div className="muted text-sm flex items-center gap-1 wrap mt-1"><Avatar src={c.author?.avatar_url} size={16} /><strong>{c.author?.login || c.commit.author?.name}</strong> melakukan commit {new Date(c.commit.author?.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <Link className="btn btn-sm mono" href={`/${r.full_name}/commit/${c.sha}`}>{c.sha.slice(0, 7)}</Link>
                  <Link className="btn btn-sm" href={repoUrl(owner, repo, "tree", c.sha)} title="Jelajahi kode pada commit ini" aria-label="Jelajahi kode pada commit ini"><Code size={14} className="icon" /></Link>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <Pager base={`/${r.full_name}/commits/${encPath(ref)}${path ? `/${encPath(path)}` : ""}`} page={page} hasNext={!!next} />
    </div>
  );
}
