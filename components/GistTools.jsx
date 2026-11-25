"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { ConfirmButton } from "@/components/ui/Dialog";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon } from "@/components/ui/common";

export function NewGist({ open: initial }) {
  const router = useRouter();
  const [open, setOpen] = useState(initial);
  const [run, busy] = useAction();
  const [f, setF] = useState({ desc: "", name: "", content: "", pub: false });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  if (!open) return <button className="btn btn-primary mb-3" onClick={() => setOpen(true)}><Plus size={14} className="icon" />Gist baru</button>;
  const submit = async (e) => {
    e.preventDefault();
    const r = await run(() => api("/gists", { method: "POST", body: { description: f.desc, public: f.pub, files: { [f.name.trim()]: { content: f.content } } } }), "Gist dibuat.");
    if (r.ok) { setOpen(false); setF({ desc: "", name: "", content: "", pub: false }); router.replace("/gists"); router.refresh(); }
  };
  return (
    <form onSubmit={submit} className="box box-body mb-3">
      <div className="field"><label htmlFor="gd">Deskripsi</label><input id="gd" className="input" value={f.desc} onChange={(e) => set("desc", e.target.value)} /></div>
      <div className="field"><label htmlFor="gn">Nama file *</label><input id="gn" className="input mono" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="catatan.md" required /></div>
      <div className="field"><textarea className="textarea code" style={{ minHeight: 200 }} aria-label="Isi" value={f.content} onChange={(e) => set("content", e.target.value)} required /></div>
      <label className="check"><input type="checkbox" checked={f.pub} onChange={(e) => set("pub", e.target.checked)} />Public (default secret)</label>
      <div className="flex gap-2"><button className="btn btn-primary" disabled={busy || !f.name.trim() || !f.content}><BtnIcon busy={busy} icon={Send} />Buat gist</button><button type="button" className="btn" onClick={() => setOpen(false)}>Batal</button></div>
    </form>
  );
}

export function DeleteGist({ id }) {
  const router = useRouter();
  return <ConfirmButton className="btn btn-sm btn-danger" icon={<Trash2 size={14} className="icon" />} label="" title="Hapus gist" message="Gist ini akan dihapus permanen." confirmLabel="Hapus" onConfirm={async () => { await api(`/gists/${id}`, { method: "DELETE" }); router.refresh(); }} />;
}
