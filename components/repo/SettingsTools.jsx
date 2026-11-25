"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Save, Send, Trash2, UserPlus, Webhook } from "lucide-react";
import { api } from "@/lib/client";
import { ConfirmButton } from "@/components/ui/Dialog";
import { useAction } from "@/components/ui/useAction";
import { Avatar, BtnIcon, Empty } from "@/components/ui/common";

export function GeneralForm({ r, branches }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [f, setF] = useState({ name: r.name, description: r.description || "", homepage: r.homepage || "", default_branch: r.default_branch, has_issues: r.has_issues, has_wiki: r.has_wiki, has_projects: r.has_projects, topics: (r.topics || []).join(", ") });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const save = async (e) => {
    e.preventDefault();
    const names = f.topics.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    const { topics, ...rest } = f;
    const res = await run(async () => {
      if (names.some((t) => !/^[a-z0-9][a-z0-9-]{0,49}$/.test(t))) throw new Error("Topik hanya huruf kecil, angka, dan minus.");
      const upd = await api(`/repos/${r.full_name}`, { method: "PATCH", body: { ...rest, homepage: rest.homepage || null } });
      await api(`/repos/${r.full_name}/topics`, { method: "PUT", body: { names } });
      return upd;
    }, "Pengaturan disimpan.");
    if (res.ok) { if (res.result.full_name !== r.full_name) router.replace(`/${res.result.full_name}/settings`); router.refresh(); }
  };
  return (
    <form onSubmit={save}>
      <div className="field"><label htmlFor="sn">Nama repository</label><input id="sn" className="input" value={f.name} onChange={(e) => set("name", e.target.value.trim())} pattern="[A-Za-z0-9._\-]+" required /></div>
      <div className="field"><label htmlFor="sd">Deskripsi</label><input id="sd" className="input" value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={350} /></div>
      <div className="field"><label htmlFor="sh">Website</label><input id="sh" className="input" type="url" value={f.homepage} onChange={(e) => set("homepage", e.target.value)} placeholder="https://" /></div>
      <div className="field"><label htmlFor="st">Topik (pisahkan dengan koma)</label><input id="st" className="input" value={f.topics} onChange={(e) => set("topics", e.target.value)} placeholder="nextjs, vercel" /></div>
      <div className="field"><label htmlFor="sb">Branch default</label><select id="sb" className="select" value={f.default_branch} onChange={(e) => set("default_branch", e.target.value)}>{branches.map((b) => <option key={b}>{b}</option>)}</select></div>
      <span className="label-text">Fitur</span>
      {[["has_issues", "Issue"], ["has_wiki", "Wiki"], ["has_projects", "Project"]].map(([k, l]) => <label key={k} className="check"><input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} />{l}</label>)}
      <button className="btn btn-primary mt-2" disabled={busy}><BtnIcon busy={busy} icon={Save} />Simpan perubahan</button>
    </form>
  );
}

export function Collaborators({ repo, list }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [user, setUser] = useState("");
  const [perm, setPerm] = useState("push");
  const invite = async (e) => {
    e.preventDefault();
    const r = await run(() => api(`/repos/${repo}/collaborators/${encodeURIComponent(user)}`, { method: "PUT", body: { permission: perm } }), "Undangan dikirim.");
    if (r.ok) { setUser(""); router.refresh(); }
  };
  return (
    <div>
      <form className="toolbar" onSubmit={invite}>
        <input className="input" style={{ maxWidth: 240 }} placeholder="username GitHub" aria-label="Username" value={user} onChange={(e) => setUser(e.target.value.trim())} pattern="[A-Za-z0-9-]+" required />
        <select className="select" style={{ width: "auto" }} value={perm} onChange={(e) => setPerm(e.target.value)} aria-label="Izin"><option value="pull">Read</option><option value="triage">Triage</option><option value="push">Write</option><option value="maintain">Maintain</option><option value="admin">Admin</option></select>
        <button className="btn btn-primary" disabled={busy || !user}><BtnIcon busy={busy} icon={UserPlus} />Undang</button>
      </form>
      <div className="box">{list.map((c) => (
        <div className="box-row" key={c.id} style={{ alignItems: "center" }}><Avatar src={c.avatar_url} size={32} /><Link href={`/${c.login}`} className="bold grow">{c.login}</Link><span className="pill">{c.role_name}</span>
          {c.role_name !== "admin" && <ConfirmButton className="btn btn-sm btn-danger" icon={<Trash2 size={14} className="icon" />} label="" title="Hapus kolaborator" message={`${c.login} tidak akan bisa lagi mengakses repository ini.`} confirmLabel="Hapus" onConfirm={async () => { await api(`/repos/${repo}/collaborators/${c.login}`, { method: "DELETE" }); router.refresh(); }} />}</div>))}</div>
    </div>
  );
}

export function Webhooks({ repo, list }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [url, setUrl] = useState("");
  const add = async (e) => {
    e.preventDefault();
    const r = await run(() => api(`/repos/${repo}/hooks`, { method: "POST", body: { name: "web", active: true, events: ["push"], config: { url, content_type: "json", insecure_ssl: "0" } } }), "Webhook ditambahkan.");
    if (r.ok) { setUrl(""); router.refresh(); }
  };
  return (
    <div>
      <form className="toolbar" onSubmit={add}>
        <input className="input grow" type="url" pattern="https://.*" placeholder="https://contoh.com/webhook" aria-label="URL webhook" value={url} onChange={(e) => setUrl(e.target.value.trim())} required />
        <button className="btn btn-primary" disabled={busy || !url}><BtnIcon busy={busy} icon={Plus} />Tambah webhook</button>
      </form>
      <div className="box">{!list.length && <Empty compact icon={Webhook} title="Belum ada webhook" />}{list.map((h) => (
        <div className="box-row" key={h.id} style={{ alignItems: "center" }}><span className={`pill ${h.active ? "ok" : ""}`}>{h.active ? "Aktif" : "Nonaktif"}</span><span className="grow truncate mono text-sm">{h.config?.url}</span>
          <button className="btn btn-sm" disabled={busy} onClick={() => run(() => api(`/repos/${repo}/hooks/${h.id}/pings`, { method: "POST", body: {} }), "Ping dikirim.")}><BtnIcon busy={busy} icon={Send} />Ping</button>
          <ConfirmButton className="btn btn-sm btn-danger" icon={<Trash2 size={14} className="icon" />} label="" title="Hapus webhook" message="Webhook ini akan dihapus." confirmLabel="Hapus" onConfirm={async () => { await api(`/repos/${repo}/hooks/${h.id}`, { method: "DELETE" }); router.refresh(); }} /></div>))}</div>
    </div>
  );
}

export function DangerZone({ r }) {
  const router = useRouter();
  const [owner, setOwner] = useState("");
  const patch = (body) => api(`/repos/${r.full_name}`, { method: "PATCH", body }).then(() => router.refresh());
  return (
    <div className="box danger">
      <div className="box-row" style={{ alignItems: "center" }}><div className="grow"><strong>Ubah visibilitas</strong><div className="muted text-sm">Repository ini saat ini {r.private ? "private" : "public"}.</div></div>
        <ConfirmButton label={r.private ? "Jadikan public" : "Jadikan private"} message={r.private ? "Siapa saja akan bisa melihat kode repository ini." : "Fork public dan bintang bisa hilang atau terdampak."} requireText={r.name} onConfirm={() => patch({ private: !r.private })} /></div>
      <div className="box-row" style={{ alignItems: "center" }}><div className="grow"><strong>{r.archived ? "Buka arsip" : "Arsipkan"} repository</strong><div className="muted text-sm">Repository yang diarsipkan menjadi read-only.</div></div>
        <ConfirmButton label={r.archived ? "Buka arsip" : "Arsipkan"} message="Kamu bisa membalik ini kapan saja." danger={false} onConfirm={() => patch({ archived: !r.archived })} /></div>
      <div className="box-row" style={{ alignItems: "center", flexWrap: "wrap" }}><div className="grow"><strong>Transfer kepemilikan</strong><div className="muted text-sm">Pindahkan ke user atau organisasi lain.</div></div>
        <input className="input" style={{ maxWidth: 180 }} placeholder="username tujuan" aria-label="Pemilik baru" value={owner} onChange={(e) => setOwner(e.target.value.trim())} />
        <ConfirmButton label="Transfer" disabled={!owner} message={`Repository akan ditransfer ke ${owner}. Mereka harus menerimanya.`} requireText={r.name} onConfirm={async () => { await api(`/repos/${r.full_name}/transfer`, { method: "POST", body: { new_owner: owner } }); router.refresh(); }} /></div>
      <div className="box-row" style={{ alignItems: "center" }}><div className="grow"><strong>Hapus repository ini</strong><div className="muted text-sm">Tidak bisa dibatalkan. Semua kode, issue, dan PR ikut hilang.</div></div>
        <ConfirmButton label="Hapus repository" message="Tindakan ini permanen." requireText={r.full_name} confirmLabel="Saya mengerti, hapus" onConfirm={async () => { await api(`/repos/${r.full_name}`, { method: "DELETE" }); router.replace("/"); router.refresh(); }} /></div>
    </div>
  );
}
