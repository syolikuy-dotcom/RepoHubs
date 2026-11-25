import Link from "next/link";
import { CircleCheck, CircleSlash, CircleX, ExternalLink, ListChecks, LoaderCircle, Play, Workflow } from "lucide-react";
import { gh, getRepo, safe } from "@/lib/github";
import { Empty, Pager, one, pageNum } from "@/components/ui/common";
import RunButtons from "@/components/repo/RunButtons";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Actions" };

function Status({ run }) {
  if (run.status !== "completed") return <LoaderCircle size={16} className="icon spin" style={{ color: "var(--attention)" }} aria-label="Berjalan" />;
  if (run.conclusion === "success") return <CircleCheck size={16} className="icon" style={{ color: "var(--success)" }} aria-label="Sukses" />;
  if (run.conclusion === "cancelled" || run.conclusion === "skipped") return <CircleSlash size={16} className="icon muted" aria-label="Dibatalkan" />;
  return <CircleX size={16} className="icon" style={{ color: "var(--danger)" }} aria-label="Gagal" />;
}
const dur = (r) => { const s = Math.max(0, Math.round((new Date(r.updated_at) - new Date(r.run_started_at || r.created_at)) / 1000)); return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`; };

export default async function Actions({ params, searchParams }) {
  const { owner, repo } = await params;
  const sp = await searchParams;
  const r = await getRepo(owner, repo);
  const wf = /^\d+$/.test(one(sp.workflow) || "") ? one(sp.workflow) : "";
  const page = pageNum(sp.page);
  const base = `/repos/${r.full_name}/actions`;
  const [wfs, runs] = await Promise.all([
    safe(gh(`${base}/workflows`), { workflows: [] }),
    gh(`${wf ? `${base}/workflows/${wf}/runs` : `${base}/runs`}?per_page=25&page=${page}`),
  ]);
  const canPush = !!r.permissions?.push;
  return (
    <div className="layout layout-side-main">
      <aside className="side-nav">
        <h2 className="section-title"><Workflow size={16} aria-hidden="true" />Workflow</h2>
        <Link href={`/${r.full_name}/actions`} className={!wf ? "active" : ""}><ListChecks size={16} aria-hidden="true" />Semua workflow</Link>
        {wfs.workflows.map((w) => <Link key={w.id} href={`/${r.full_name}/actions?workflow=${w.id}`} className={String(w.id) === wf ? "active" : ""}><Play size={16} aria-hidden="true" /><span className="truncate">{w.name}</span></Link>)}
      </aside>
      <section>
        <div className="box">
          <div className="box-header"><span className="box-title">{runs.total_count} workflow run</span></div>
          {!runs.workflow_runs.length ? <Empty icon={Play} title="Belum ada workflow run">Tambahkan file YAML di <code>.github/workflows</code> lewat halaman Upload.</Empty> : runs.workflow_runs.map((w) => (
            <div className="box-row" key={w.id} style={{ alignItems: "center" }}>
              <Status run={w} />
              <div className="grow">
                <a href={w.html_url} target="_blank" rel="noopener noreferrer" className="bold wrap-any fg-link meta">{w.display_title}<ExternalLink size={12} aria-hidden="true" /></a>
                <div className="muted text-sm wrap-any">{w.name} #{w.run_number} · {w.event} oleh {w.actor?.login} · <Link href={`/${r.full_name}/tree/${encodeURIComponent(w.head_branch || r.default_branch)}`} className="topic" style={{ lineHeight: "18px" }}>{w.head_branch}</Link></div>
              </div>
              <div className="muted text-sm shrink0 center" style={{ minWidth: 70 }}>{timeAgo(w.created_at)}<br />{dur(w)}</div>
              {canPush && <RunButtons repo={r.full_name} id={w.id} active={w.status !== "completed"} />}
            </div>
          ))}
        </div>
        <Pager base={`/${r.full_name}/actions`} params={{ workflow: wf }} page={page} hasNext={runs.total_count > page * 25} />
      </section>
    </div>
  );
}
