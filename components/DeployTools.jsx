"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RefreshCw, Trash2, Unplug, Plug } from "lucide-react";
import { post, vcApi } from "@/lib/client";
import { ConfirmButton } from "@/components/ui/Dialog";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon } from "@/components/ui/common";

export function ConnectVercel() {
  const router = useRouter();
  const [run, busy] = useAction();
  const [token, setToken] = useState("");
  const [team, setTeam] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    const r = await run(() => post("/api/vc/connect", { token, teamId: team }), "Vercel terhubung.");
    if (r.ok) { setToken(""); router.refresh(); }
  };
  return (
    <form onSubmit={submit} className="box box-body" style={{ maxWidth: 480 }}>
      <div className="field"><label htmlFor="vt">Vercel access token</label><input id="vt" className="input" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value.trim())} required /><div className="hint">Buat di vercel.com/account/tokens. Disimpan terenkripsi di cookie httpOnly.</div></div>
      <div className="field"><label htmlFor="vteam">Team ID (opsional)</label><input id="vteam" className="input mono" placeholder="team_xxxxxxxx" value={team} onChange={(e) => setTeam(e.target.value.trim())} /></div>
      <button className="btn btn-primary" disabled={busy || token.length < 16}><BtnIcon busy={busy} icon={Plug} />Hubungkan</button>
    </form>
  );
}

export function Disconnect() {
  const router = useRouter();
  return <ConfirmButton className="btn btn-sm" icon={<Unplug size={14} className="icon" />} label="Putuskan" danger={false} title="Putuskan Vercel" message="Token Vercel dihapus dari sesi ini." onConfirm={async () => { await fetch("/api/vc/connect", { method: "DELETE", headers: { "x-requested-with": "repohub" } }); router.refresh(); }} />;
}

export function Redeploy({ name, deploymentId }) {
  const router = useRouter();
  const [run, busy] = useAction();
  return <button className="btn btn-sm" disabled={busy} onClick={async () => { const r = await run(() => vcApi("/v13/deployments?forceNew=1&skipAutoDetectionConfirmation=1", { method: "POST", body: { name, deploymentId, target: "production" } }), "Redeploy dimulai."); if (r.ok) router.refresh(); }}><BtnIcon busy={busy} icon={RefreshCw} />Redeploy</button>;
}

export function DeleteProject({ id, name }) {
  const router = useRouter();
  return <ConfirmButton className="btn btn-sm btn-danger" icon={<Trash2 size={14} className="icon" />} label="" title="Hapus project Vercel" message="Project dan semua deployment-nya akan dihapus permanen." requireText={name} confirmLabel="Hapus project" onConfirm={async () => { await vcApi(`/v9/projects/${encodeURIComponent(id)}`, { method: "DELETE" }); router.refresh(); }} />;
}

export function ImportRepo({ repos }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [repo, setRepo] = useState(repos[0] || "");
  if (!repos.length) return null;
  const go = async () => {
    const r = await run(() => vcApi("/v10/projects", { method: "POST", body: { name: repo.split("/")[1].toLowerCase().replace(/[^a-z0-9._-]/g, "-").slice(0, 100), gitRepository: { type: "github", repo } } }), "Project dibuat dan terhubung ke repo.");
    if (r.ok) router.refresh();
  };
  return (
    <div className="toolbar">
      <select className="select" style={{ maxWidth: 320 }} value={repo} onChange={(e) => setRepo(e.target.value)} aria-label="Repository">{repos.map((x) => <option key={x}>{x}</option>)}</select>
      <button className="btn btn-primary" onClick={go} disabled={busy}><BtnIcon busy={busy} icon={Download} />Import dari GitHub</button>
    </div>
  );
}
