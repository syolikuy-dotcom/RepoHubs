import Link from "next/link";
import { Activity, Code, Eye, Globe, GitFork, Users } from "lucide-react";
import { gh, getRepo, safe } from "@/lib/github";
import { Avatar, LangBar, PageTitle } from "@/components/ui/common";
import { fmtNum } from "@/lib/utils";

export const metadata = { title: "Insight" };

export default async function Pulse({ params }) {
  const { owner, repo } = await params;
  const r = await getRepo(owner, repo);
  const b = `/repos/${r.full_name}`;
  const [activity, contribs, langs, views, clones, refs] = await Promise.all([
    safe(gh(`${b}/stats/commit_activity`), null), safe(gh(`${b}/stats/contributors`), null), safe(gh(`${b}/languages`), {}),
    r.permissions?.push ? safe(gh(`${b}/traffic/views`), null) : null, r.permissions?.push ? safe(gh(`${b}/traffic/clones`), null) : null,
    r.permissions?.push ? safe(gh(`${b}/traffic/popular/referrers`), []) : [],
  ]);
  const weeks = Array.isArray(activity) ? activity : [];
  const max = Math.max(1, ...weeks.map((w) => w.total));
  const top = (Array.isArray(contribs) ? contribs : []).sort((a, c) => c.total - a.total).slice(0, 10);
  return (
    <div className="mw-1000">
      <div className="page-head"><PageTitle icon={Activity} small>Insight</PageTitle></div>
      <div className="box mb-3"><div className="box-header"><Activity size={16} aria-hidden="true" /><span className="box-title">Aktivitas commit (52 minggu)</span></div><div className="box-body">
        {weeks.length ? <div className="chart-bars" role="img" aria-label="Grafik commit per minggu">{weeks.map((w) => <i key={w.week} style={{ height: `${Math.max(2, (w.total / max) * 100)}%` }} title={`${w.total} commit`} />)}</div>
          : <span className="muted">GitHub masih menghitung statistik. Muat ulang beberapa saat lagi.</span>}</div></div>
      <div className="row-fields mb-3">
        <div className="box"><div className="box-header"><Code size={16} aria-hidden="true" /><span className="box-title">Bahasa</span></div><div className="box-body"><LangBar langs={langs} /></div></div>
        <div className="box"><div className="box-header"><Globe size={16} aria-hidden="true" /><span className="box-title">Traffic 14 hari</span></div><div className="box-body">
          {views || clones ? <div className="kv"><Eye size={16} className="icon" /><span><strong>{fmtNum(views?.count || 0)}</strong> tayangan ({fmtNum(views?.uniques || 0)} unik)</span></div> : <span className="muted">Hanya tersedia untuk yang punya akses tulis.</span>}
          {clones && <div className="kv"><GitFork size={16} className="icon" /><span><strong>{fmtNum(clones.count)}</strong> clone ({fmtNum(clones.uniques)} unik)</span></div>}
          {refs.slice(0, 4).map((x) => <div key={x.referrer} className="kv text-sm"><span className="truncate">{x.referrer}</span><strong>{x.count}</strong></div>)}</div></div>
      </div>
      <div className="box"><div className="box-header"><Users size={16} aria-hidden="true" /><span className="box-title">Kontributor teratas</span></div>
        {top.length ? top.map((c) => (
          <div className="box-row" key={c.author.id} style={{ alignItems: "center" }}><Avatar src={c.author.avatar_url} size={32} /><Link href={`/${c.author.login}`} className="bold grow">{c.author.login}</Link><span className="muted">{c.total} commit</span></div>
        )) : <div className="box-body muted">Belum ada data.</div>}</div>
    </div>
  );
}
