"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Send, Tag, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { ConfirmButton, Dialog } from "@/components/ui/Dialog";
import MarkdownEditor from "@/components/ui/MarkdownEditor";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon } from "@/components/ui/common";

export function NewRelease({ repo, branches, defaultBranch }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [run, busy] = useAction();
  const [f, setF] = useState({ tag: "", target: defaultBranch, name: "", body: "", pre: false, draft: false });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const submit = async () => {
    const r = await run(() => api(`/repos/${repo}/releases`, { method: "POST", body: { tag_name: f.tag, target_commitish: f.target, name: f.name || f.tag, body: f.body, prerelease: f.pre, draft: f.draft } }), "Rilis dibuat.");
    if (r.ok) { setOpen(false); router.refresh(); }
  };
  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={14} className="icon" />Rilis baru</button>
      <Dialog open={open} onClose={() => !busy && setOpen(false)} title="Rilis baru" icon={Tag}
        footer={<><button className="btn" onClick={() => setOpen(false)} disabled={busy}>Batal</button><button className="btn btn-primary" onClick={submit} disabled={busy || !f.tag.trim()}><BtnIcon busy={busy} icon={Send} />Publikasikan</button></>}>
        <div className="row-fields">
          <div className="field"><label htmlFor="rt">Tag *</label><input id="rt" className="input mono" placeholder="v1.0.0" value={f.tag} onChange={(e) => set("tag", e.target.value.trim())} /></div>
          <div className="field"><label htmlFor="rb">Target</label><select id="rb" className="select" value={f.target} onChange={(e) => set("target", e.target.value)}>{branches.map((b) => <option key={b}>{b}</option>)}</select></div>
        </div>
        <div className="field"><label htmlFor="rn">Judul</label><input id="rn" className="input" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={f.tag || "Judul rilis"} /></div>
        <div className="field"><MarkdownEditor value={f.body} onChange={(v) => set("body", v)} placeholder="Catatan rilis" rows={5} /></div>
        <label className="check"><input type="checkbox" checked={f.pre} onChange={(e) => set("pre", e.target.checked)} />Pre-release</label>
        <label className="check"><input type="checkbox" checked={f.draft} onChange={(e) => set("draft", e.target.checked)} />Simpan sebagai draft</label>
      </Dialog>
    </>
  );
}

export function DeleteRelease({ repo, id, tag }) {
  const router = useRouter();
  return <ConfirmButton className="btn btn-sm btn-danger" icon={<Trash2 size={14} className="icon" />} label="Hapus" title="Hapus rilis" message={`Rilis ${tag} akan dihapus. Tag git-nya tetap ada.`}
    onConfirm={async () => { await api(`/repos/${repo}/releases/${id}`, { method: "DELETE" }); router.refresh(); }} />;
}
