"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleDot, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { ConfirmButton } from "@/components/ui/Dialog";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon } from "@/components/ui/common";

export function NewLabel({ repo }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [f, setF] = useState({ name: "", color: "#2dd4bf", description: "" });
  const submit = async (e) => {
    e.preventDefault();
    const r = await run(() => api(`/repos/${repo}/labels`, { method: "POST", body: { name: f.name.trim(), color: f.color.slice(1), description: f.description } }), "Label dibuat.");
    if (r.ok) { setF({ ...f, name: "", description: "" }); router.refresh(); }
  };
  return (
    <form className="toolbar" onSubmit={submit}>
      <input className="input" style={{ maxWidth: 200 }} placeholder="Nama label" aria-label="Nama label" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={50} />
      <input className="input" style={{ maxWidth: 260 }} placeholder="Deskripsi (opsional)" aria-label="Deskripsi" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={100} />
      <input type="color" aria-label="Warna" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} style={{ width: 40, height: 32, border: "1px solid var(--border)", borderRadius: 6, background: "none", padding: 2 }} />
      <button className="btn btn-primary" disabled={busy || !f.name.trim()}><BtnIcon busy={busy} icon={Plus} />Buat label</button>
    </form>
  );
}

export function DeleteLabel({ repo, name }) {
  const router = useRouter();
  return <ConfirmButton className="btn btn-sm btn-danger" icon={<Trash2 size={14} className="icon" />} label="" title="Hapus label" message={`Label "${name}" dicabut dari semua issue dan PR.`} confirmLabel="Hapus" onConfirm={async () => { await api(`/repos/${repo}/labels/${encodeURIComponent(name)}`, { method: "DELETE" }); router.refresh(); }} />;
}

export function NewMilestone({ repo }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [f, setF] = useState({ title: "", due: "", description: "" });
  const submit = async (e) => {
    e.preventDefault();
    const r = await run(() => api(`/repos/${repo}/milestones`, { method: "POST", body: { title: f.title.trim(), description: f.description, ...(f.due ? { due_on: new Date(`${f.due}T23:59:59Z`).toISOString() } : {}) } }), "Milestone dibuat.");
    if (r.ok) { setF({ title: "", due: "", description: "" }); router.refresh(); }
  };
  return (
    <form className="toolbar" onSubmit={submit}>
      <input className="input" style={{ maxWidth: 220 }} placeholder="Judul milestone" aria-label="Judul" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
      <input className="input" style={{ maxWidth: 170 }} type="date" aria-label="Tenggat" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />
      <button className="btn btn-primary" disabled={busy || !f.title.trim()}><BtnIcon busy={busy} icon={Plus} />Buat milestone</button>
    </form>
  );
}

export function CloseMilestone({ repo, number, state }) {
  const router = useRouter();
  const [run, busy] = useAction();
  return <button className="btn btn-sm" disabled={busy} onClick={async () => { const r = await run(() => api(`/repos/${repo}/milestones/${number}`, { method: "PATCH", body: { state: state === "open" ? "closed" : "open" } })); if (r.ok) router.refresh(); }}><BtnIcon busy={busy} icon={state === "open" ? CircleCheck : CircleDot} />{state === "open" ? "Tutup" : "Buka kembali"}</button>;
}
