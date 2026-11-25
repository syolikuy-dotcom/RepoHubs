import Link from "next/link";
import { Gauge, KeyRound, ShieldCheck, Triangle, UserRound, Plug, CircleCheck, ExternalLink } from "lucide-react";
import { gh, safe } from "@/lib/github";
import { getVercelSession, requireSession } from "@/lib/session";
import { Flash, PageTitle, one } from "@/components/ui/common";
import { ProfileForm, SignOut, SshKeys } from "@/components/AccountTools";

export const metadata = { title: "Pengaturan" };
const TABS = { profile: "Profil", keys: "SSH key", security: "Keamanan" };
const TAB_ICON = { profile: UserRound, keys: KeyRound, security: ShieldCheck };

export default async function Settings({ searchParams }) {
  const s = await requireSession();
  const sp = await searchParams;
  const tab = TABS[one(sp.tab)] ? one(sp.tab) : "profile";
  const [me, keys, limit, vc] = await Promise.all([
    gh("/user"), tab === "keys" ? safe(gh("/user/keys"), []) : [], tab === "security" ? safe(gh("/rate_limit"), null) : null, getVercelSession(),
  ]);
  const core = limit?.resources?.core;
  const TabIcon = TAB_ICON[tab];
  return (
    <div className="container page">
      <div className="layout layout-side-main">
        <aside className="side-nav">{Object.entries(TABS).map(([k, v]) => { const I = TAB_ICON[k]; return <Link key={k} href={`/settings?tab=${k}`} className={tab === k ? "active" : ""} aria-current={tab === k ? "page" : undefined}><I size={16} aria-hidden="true" />{v}</Link>; })}</aside>
        <section className="mw-720">
          <div className="settings-title"><PageTitle icon={TabIcon}>{TABS[tab]}</PageTitle></div>
          {tab === "profile" && <ProfileForm u={me} />}
          {tab === "keys" && <SshKeys keys={keys} />}
          {tab === "security" && (
            <>
              <div className="box mb-3">
                <div className="box-row"><span className="grow meta"><UserRound size={16} className="muted" aria-hidden="true" />Akun</span><strong>{s.user.login}</strong></div>
                <div className="box-row"><span className="grow meta"><KeyRound size={16} className="muted" aria-hidden="true" />Scope token</span><span className="wrap-any" style={{ textAlign: "right" }}>{s.scopes.length ? s.scopes.map((x) => <code key={x} style={{ marginLeft: 4 }}>{x}</code>) : <span className="muted">fine-grained token (scope tidak ditampilkan)</span>}</span></div>
                {core && <div className="box-row"><span className="grow meta"><Gauge size={16} className="muted" aria-hidden="true" />Kuota API</span><span>{core.remaining}/{core.limit}</span></div>}
                <div className="box-row"><span className="grow meta"><Triangle size={16} className="muted" aria-hidden="true" />Vercel</span>{vc ? <span className="add-t meta"><CircleCheck size={14} aria-hidden="true" />Terhubung</span> : <Link href="/deploy" className="meta"><Plug size={14} aria-hidden="true" />Hubungkan</Link>}</div>
              </div>
              <Flash type="info">Token disimpan terenkripsi (AES-256-GCM) di cookie <code>httpOnly</code> + <code>Secure</code> + <code>SameSite=Lax</code>, berlaku 7 hari. Untuk mencabut sepenuhnya, hapus token di <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="meta">GitHub<ExternalLink size={12} aria-hidden="true" /></a>.</Flash>
              <SignOut />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
