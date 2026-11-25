import Link from "next/link";
import { ArrowLeft, GitCompare } from "lucide-react";
import { gh, getRefs, getRepo, safe } from "@/lib/github";
import { PageTitle, one } from "@/components/ui/common";
import { CreatePR } from "@/components/repo/IssueTools";
import Diff from "@/components/repo/Diff";
import { Flash } from "@/components/ui/common";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Bandingkan" };

export default async function Compare({ params, searchParams }) {
  const { owner, repo } = await params;
  const sp = await searchParams;
  const r = await getRepo(owner, repo);
  const { branches } = await getRefs(owner, repo);
  const base = one(sp.base) || r.default_branch;
  const head = one(sp.head) || "";
  const cmp = head && head !== base && branches.includes(base) && branches.includes(head)
    ? await safe(gh(`/repos/${r.full_name}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`), null) : null;

  return (
    <div>
      <PageTitle icon={GitCompare}>Bandingkan perubahan</PageTitle>
      <p className="page-lead" style={{ marginBottom: 16 }}>Pilih dua branch untuk melihat perbedaan atau membuat pull request.</p>
      <form className="toolbar" action={`/${r.full_name}/compare`}>
        <label className="muted" htmlFor="cb">base:</label>
        <select id="cb" className="select auto" name="base" defaultValue={base}>{branches.map((b) => <option key={b}>{b}</option>)}</select>
        <ArrowLeft size={16} className="muted" aria-label="dibandingkan dengan" />
        <label className="muted" htmlFor="ch">compare:</label>
        <select id="ch" className="select auto" name="head" defaultValue={head}><option value="">Pilih branch</option>{branches.filter((b) => b !== base).map((b) => <option key={b}>{b}</option>)}</select>
        <button className="btn"><GitCompare size={14} className="icon" />Bandingkan</button>
      </form>

      {head && !cmp && <Flash type="warn">Tidak bisa membandingkan <code>{base}</code> dengan <code>{head}</code>. Pastikan kedua branch ada.</Flash>}
      {cmp && (cmp.ahead_by === 0 ? <Flash type="info">Tidak ada perbedaan. <code>{head}</code> tidak punya commit baru dibanding <code>{base}</code>.</Flash> : (
        <>
          {cmp.status === "diverged" && <Flash type="warn"><code>{head}</code> tertinggal {cmp.behind_by} commit dari <code>{base}</code>, kemungkinan ada konflik saat merge.</Flash>}
          {r.permissions?.push && <CreatePR repo={r.full_name} base={base} head={head} defaultTitle={cmp.commits.length === 1 ? cmp.commits[0].commit.message.split("\n")[0] : head.replace(/[-_]/g, " ")} />}
          <p className="muted"><strong>{cmp.ahead_by} commit</strong> · <strong>{cmp.files?.length || 0} file</strong> berubah</p>
          <div className="box mb-3">{cmp.commits.slice(-30).reverse().map((c) => (
            <div className="box-row" key={c.sha} style={{ padding: "8px 16px" }}><Link className="grow truncate fg-link" href={`/${r.full_name}/commit/${c.sha}`}>{c.commit.message.split("\n")[0]}</Link><span className="muted text-sm shrink0">{c.author?.login} · {timeAgo(c.commit.author?.date)}</span></div>))}</div>
          <Diff files={cmp.files} />
        </>
      ))}
    </div>
  );
}
