"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Plus, Save, Trash2 } from "lucide-react";
import { api, post } from "@/lib/client";
import { ConfirmButton } from "@/components/ui/Dialog";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon, Empty } from "@/components/ui/common";

export function ProfileForm({ u }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [f, setF] = useState({ name: u.name || "", bio: u.bio || "", company: u.company || "", location: u.location || "", blog: u.blog || "" });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const save = async (e) => { e.preventDefault(); const r = await run(() => api("/user", { method: "PATCH", body: f }), "Profil disimpan."); if (r.ok) router.refresh(); };
  return (
    <form onSubmit={save}>
      {[["name", "Nama"], ["company", "Perusahaan"], ["location", "Lokasi"], ["blog", "Website"]].map(([k, l]) => <div className="field" key={k}><label htmlFor={`p-${k}`}>{l}</label><input id={`p-${k}`} className="input" value={f[k]} onChange={(e) => set(k, e.target.value)} /></div>)}
      <div className="field"><label htmlFor="p-bio">Bio</label><textarea id="p-bio" className="textarea" style={{ minHeight: 80 }} value={f.bio} onChange={(e) => set("bio", e.target.value)} maxLength={160} /></div>
      <button className="btn btn-primary" disabled={busy}><BtnIcon busy={busy} icon={Save} />Perbarui profil</button>
    </form>
  );
}

export function SshKeys({ keys }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const add = async (e) => { e.preventDefault(); const r = await run(() => api("/user/keys", { method: "POST", body: { title, key: key.trim() } }), "SSH key ditambahkan."); if (r.ok) { setTitle(""); setKey(""); router.refresh(); } };
  return (
    <div>
      <div className="box mb-3">{!keys.length && <Empty compact icon={KeyRound} title="Belum ada SSH key" />}{keys.map((k) => (
        <div className="box-row" key={k.id} style={{ alignItems: "center" }}><KeyRound size={16} className="icon muted" /><div className="grow wrap-any"><strong>{k.title}</strong><div className="muted text-sm mono truncate">{k.key.slice(0, 48)}…</div></div>
          <ConfirmButton className="btn btn-sm btn-danger" icon={<Trash2 size={14} className="icon" />} label="" title="Hapus SSH key" message={`Key "${k.title}" tidak bisa lagi dipakai untuk akses.`} confirmLabel="Hapus" onConfirm={async () => { await api(`/user/keys/${k.id}`, { method: "DELETE" }); router.refresh(); }} /></div>))}</div>
      <form onSubmit={add} className="box box-body"><h3 className="section-title">Tambah SSH key</h3>
        <div className="field"><label htmlFor="kt">Judul</label><input id="kt" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
        <div className="field"><label htmlFor="kk">Key</label><textarea id="kk" className="textarea mono" style={{ minHeight: 100, fontSize: 12 }} placeholder="ssh-ed25519 AAAA…" value={key} onChange={(e) => setKey(e.target.value)} required /></div>
        <button className="btn btn-primary" disabled={busy || !title || !key}><BtnIcon busy={busy} icon={Plus} />Tambah key</button></form>
    </div>
  );
}

export function SignOut() {
  const router = useRouter();
  return <ConfirmButton label="Keluar dari RepoHub" icon={<LogOut size={14} className="icon" />} danger={false} className="btn btn-danger" title="Keluar" message="Cookie sesi dihapus. Token kamu di GitHub tetap aktif sampai kamu mencabutnya." onConfirm={async () => { await post("/api/auth/logout"); router.replace("/login"); router.refresh(); }} />;
}
