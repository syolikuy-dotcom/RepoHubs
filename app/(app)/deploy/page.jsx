import Link from "next/link";
import { CircleCheck, CircleX, ExternalLink, Hourglass, Rocket, Triangle, CircleSlash, FolderGit2, Layers } from "lucide-react";
import { getVercelSession } from "@/lib/session";
import { gh, safe } from "@/lib/github";
import { vc, VcError } from "@/lib/vercel";
import { Empty, Flash, PageTitle, SectionTitle, one } from "@/components/ui/common";
import { ConnectVercel, DeleteProject, Disconnect, ImportRepo, Redeploy } from "@/components/DeployTools";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Deploy" };
const STATE = { READY: "ok", ERROR: "bad", CANCELED: "", QUEUED: "warn", BUILDING: "warn", INITIALIZING: "warn" };
const STATE_ICON = { READY: CircleCheck, ERROR: CircleX, CANCELED: CircleSlash, QUEUED: Hourglass, BUILDING: Hourglass, INITIALIZING: Hourglass };
function StatePill({ state }) {
  const I = STATE_ICON[state] || Hourglass;
  return <span className={`pill ${STATE[state] ?? ""}`}><I size={12} aria-hidden="true" />{state}</span>;
}

export default async function Deploy({ searchParams }) {
  const session = await getVercelSession();
  const pid = one((await searchParams).project) || "";
  let projects = [], deployments = [], error = "";
  if (session) {
    try {
      [projects, deployments] = await Promise.all([
        vc("/v9/projects?limit=50").then((d) => d.projects),
        vc(`/v6/deployments?limit=20${/^[\w-]+$/.test(pid) ? `&projectId=${pid}` : ""}`).then((d) => d.deployments),
      ]);
    } catch (e) { error = e instanceof VcError ? e.message : "Gagal memuat data Vercel."; }
  }
  const repos = session ? await safe(gh("/user/repos?sort=pushed&per_page=50&affiliation=owner"), []) : [];
  const linked = new Set(projects.map((p) => p.link?.repo && `${p.link.org || p.link.repoOwner}/${p.link.repo}`));

  return (
    <div className="container page">
      <div className="page-head"><PageTitle icon={Triangle}>Vercel</PageTitle>{session && <Disconnect />}</div>
      {!session ? (
        <><Flash type="info">Hubungkan Vercel untuk melihat project, deployment, dan redeploy dari sini.</Flash><ConnectVercel /></>
      ) : (
        <>
          {error && <Flash type="error">{error}</Flash>}
          <SectionTitle icon={FolderGit2}>Import repository</SectionTitle>
          <ImportRepo repos={repos.map((r) => r.full_name).filter((n) => !linked.has(n))} />
          <SectionTitle icon={Layers} className="mt-4">Project ({projects.length})</SectionTitle>
          {!projects.length ? <div className="box"><Empty icon={Rocket} title="Belum ada project">Import repository GitHub di atas untuk membuat project pertama.</Empty></div> : (
            <div className="box">{projects.map((p) => {
              const last = p.latestDeployments?.[0];
              return (
                <div className="box-row" key={p.id} style={{ alignItems: "center", flexWrap: "wrap" }}>
                  <div className="grow">
                    <Link href={`/deploy?project=${p.id}`} className="bold wrap-any">{p.name}</Link>
                    <div className="muted text-sm wrap-any">{p.framework || "static"}{p.link?.repo ? ` · ${p.link.org || p.link.repoOwner || ""}/${p.link.repo}` : ""} · diperbarui {timeAgo(p.updatedAt)}</div>
                  </div>
                  {last && <StatePill state={last.readyState} />}
                  {last?.alias?.[0] && <a className="btn btn-sm" href={`https://${last.alias[0]}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} className="icon" />Buka</a>}
                  {last && <Redeploy name={p.name} deploymentId={last.id} />}
                  <DeleteProject id={p.id} name={p.name} />
                </div>);
            })}</div>
          )}
          <SectionTitle icon={Rocket} className="mt-4">Deployment terbaru {pid && <Link href="/deploy" className="text-sm">(lihat semua)</Link>}</SectionTitle>
          <div className="box">{!deployments.length ? <Empty compact icon={Rocket} title="Belum ada deployment" /> : deployments.map((d) => (
            <div className="box-row" key={d.uid} style={{ alignItems: "center" }}>
              <StatePill state={d.state || d.readyState} />
              <div className="grow wrap-any"><strong>{d.name}</strong> <span className="muted text-sm">{d.meta?.githubCommitMessage?.split("\n")[0] || d.target || "preview"}</span></div>
              <span className="muted text-sm shrink0">{timeAgo(d.created)}</span>
              {d.url && <a className="btn btn-sm" href={`https://${d.url}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} className="icon" />Buka</a>}
            </div>))}</div>
        </>
      )}
    </div>
  );
}
