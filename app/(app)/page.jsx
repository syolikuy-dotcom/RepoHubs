import Link from "next/link";
import { BookMarked, CircleCheck, Gauge, House, Plug, Plus, Rocket, Triangle, CloudUpload, UserRound, Zap } from "lucide-react";
import { gh, safe } from "@/lib/github";
import { requireSession } from "@/lib/session";
import { getVercelSession } from "@/lib/session";
import Feed from "@/components/Feed";
import RepoFilter from "@/components/RepoFilter";
import { Avatar, Flash, PageTitle, SectionTitle } from "@/components/ui/common";

export const metadata = { title: "Beranda" };

export default async function Dashboard() {
  const s = await requireSession();
  const [repos, events, limit, vercel] = await Promise.all([
    safe(gh("/user/repos?sort=pushed&per_page=30&affiliation=owner,collaborator,organization_member"), []),
    safe(gh(`/users/${s.user.login}/received_events?per_page=40`), []),
    safe(gh("/rate_limit"), null),
    getVercelSession(),
  ]);
  const core = limit?.resources?.core;
  const missing = ["repo"].filter((x) => s.scopes.length && !s.scopes.includes(x));

  return (
    <div className="container page">
      {missing.length > 0 && <Flash type="warn">Token kamu tidak punya scope <code>repo</code>, jadi repository private dan upload tidak akan jalan. Buat token baru lewat halaman <Link href="/settings?tab=security">Keamanan</Link>.</Flash>}
      <div className="layout layout-3">
        <aside>
          <div className="flex items-center between mb-2"><SectionTitle icon={BookMarked} className="mb-0">Repository teratas</SectionTitle><Link href="/new" className="btn btn-primary btn-sm"><Plus size={14} className="icon" />Baru</Link></div>
          <RepoFilter repos={repos} />
          <p className="mt-2"><Link href={`/${s.user.login}?tab=repositories`} className="text-sm">Lihat semua repository</Link></p>
        </aside>

        <section aria-label="Aktivitas">
          <PageTitle icon={House} small>Beranda</PageTitle>
          <Feed events={events} />
        </section>

        <aside>
          <div className="box">
            <div className="box-header"><UserRound size={16} aria-hidden="true" /><span className="box-title">Akun</span></div>
            <div className="box-body">
              <div className="flex items-center gap-2 mb-3"><Avatar src={s.user.avatar_url} size={40} /><div className="min-w-0"><div className="bold truncate">{s.user.name || s.user.login}</div><div className="muted text-sm truncate">@{s.user.login}</div></div></div>
              {core && (
                <div className="mb-3">
                  <div className="flex between text-sm"><span className="meta"><Gauge size={14} aria-hidden="true" />Kuota API GitHub</span><span className="muted">{core.remaining}/{core.limit}</span></div>
                  <div className="progress mt-1" role="progressbar" aria-label="Kuota API GitHub" aria-valuenow={core.remaining} aria-valuemin={0} aria-valuemax={core.limit}><i style={{ width: `${(core.remaining / core.limit) * 100}%` }} /></div>
                </div>
              )}
              <div className="text-sm muted meta"><Triangle size={14} aria-hidden="true" />Vercel: {vercel ? <span className="add-t meta"><CircleCheck size={14} aria-hidden="true" />Terhubung</span> : <Link href="/deploy" className="meta"><Plug size={14} aria-hidden="true" />Belum terhubung</Link>}</div>
            </div>
          </div>
          <div className="box mt-3">
            <div className="box-header"><Zap size={16} aria-hidden="true" /><span className="box-title">Aksi cepat</span></div>
            <div className="box-body" style={{ display: "grid", gap: 8 }}>
              <Link className="btn" href="/new"><BookMarked size={14} className="icon" />Buat repository</Link>
              {repos[0] && <Link className="btn" href={`/${repos[0].full_name}/upload`}><CloudUpload size={14} className="icon" />Upload ke {repos[0].name}</Link>}
              <Link className="btn" href="/deploy"><Rocket size={14} className="icon" />Deploy ke Vercel</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
