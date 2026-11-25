import Link from "next/link";
import { Settings, TriangleAlert, UserPlus, Webhook } from "lucide-react";
import { gh, getRefs, getRepo, safe } from "@/lib/github";
import { Collaborators, DangerZone, GeneralForm, Webhooks } from "@/components/repo/SettingsTools";
import { Flash, PageTitle, one } from "@/components/ui/common";

export const metadata = { title: "Pengaturan repository" };
const TABS = { general: "Umum", access: "Kolaborator", hooks: "Webhook", danger: "Zona bahaya" };
const TAB_ICON = { general: Settings, access: UserPlus, hooks: Webhook, danger: TriangleAlert };

export default async function RepoSettings({ params, searchParams }) {
  const { owner, repo } = await params;
  const r = await getRepo(owner, repo);
  if (!r.permissions?.admin) return <Flash type="warn">Hanya admin repository yang bisa membuka pengaturan.</Flash>;
  const tab = TABS[one((await searchParams).tab)] ? one((await searchParams).tab) : "general";
  const b = `/repos/${r.full_name}`;
  const { branches } = await getRefs(owner, repo);
  const data = tab === "access" ? await safe(gh(`${b}/collaborators?per_page=100`), []) : tab === "hooks" ? await safe(gh(`${b}/hooks`), []) : null;
  return (
    <div className="layout layout-side-main">
      <aside className="side-nav">{Object.entries(TABS).map(([k, v]) => { const I = TAB_ICON[k]; return <Link key={k} href={`/${r.full_name}/settings?tab=${k}`} className={tab === k ? "active" : ""} aria-current={tab === k ? "page" : undefined}><I size={16} aria-hidden="true" />{v}</Link>; })}</aside>
      <section className="mw-720">
        <div className="settings-title"><PageTitle icon={TAB_ICON[tab]}>{TABS[tab]}</PageTitle></div>
        {tab === "general" && <GeneralForm r={r} branches={branches.length ? branches : [r.default_branch]} />}
        {tab === "access" && <Collaborators repo={r.full_name} list={data} />}
        {tab === "hooks" && <Webhooks repo={r.full_name} list={data} />}
        {tab === "danger" && <DangerZone r={r} />}
      </section>
    </div>
  );
}
