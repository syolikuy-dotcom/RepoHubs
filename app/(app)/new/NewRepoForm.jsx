"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookPlus, Check, Globe, Lock, LoaderCircle, X } from "lucide-react";
import { api } from "@/lib/client";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon } from "@/components/ui/common";

export default function NewRepoForm({ user, orgs, gitignores, licenses }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [f, setF] = useState({ owner: user, name: "", description: "", priv: false, readme: true, gitignore: "", license: "" });
  const [avail, setAvail] = useState("idle");
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const valid = /^[A-Za-z0-9._-]{1,100}$/.test(f.name) && f.name !== "." && f.name !== "..";

  useEffect(() => {
    if (!valid) { setAvail("idle"); return; }
    setAvail("checking");
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try { await api(`/repos/${f.owner}/${f.name}`, { signal: ctl.signal }); setAvail("taken"); }
      catch (e) { if (e.name !== "AbortError") setAvail(e.status === 404 ? "free" : "idle"); }
    }, 400);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [f.owner, f.name, valid]);

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      name: f.name, description: f.description || undefined, private: f.priv, auto_init: f.readme,
      gitignore_template: f.gitignore || undefined, license_template: f.license || undefined,
    };
    const r = await run(() => api(f.owner === user ? "/user/repos" : `/orgs/${f.owner}/repos`, { method: "POST", body }), "Repository dibuat.");
    if (r.ok) router.push(`/${r.result.full_name}${f.readme ? "" : "/upload"}`);
  };

  return (
    <form onSubmit={submit}>
      <div className="row-fields">
        <div className="field"><label htmlFor="owner">Pemilik</label>
          <select id="owner" className="select" value={f.owner} onChange={(e) => set("owner", e.target.value)}>{[user, ...orgs].map((o) => <option key={o}>{o}</option>)}</select></div>
        <div className="field"><label htmlFor="name">Nama repository *</label>
          <input id="name" className={`input ${f.name && !valid ? "invalid" : ""}`} value={f.name} onChange={(e) => set("name", e.target.value.trim())} required maxLength={100} autoComplete="off" spellCheck={false} />
          <div className="hint" aria-live="polite">
            {f.name && !valid ? "Hanya huruf, angka, titik, minus, dan underscore." : avail === "taken" ? <span className="del-t meta"><X size={12} aria-hidden="true" />Nama ini sudah dipakai.</span> : avail === "free" ? <span className="add-t meta"><Check size={12} aria-hidden="true" />{f.name} tersedia.</span> : avail === "checking" ? <span className="meta"><LoaderCircle size={12} className="spin" aria-hidden="true" />Mengecek ketersediaan…</span> : "Nama pendek dan mudah diingat paling bagus."}
          </div></div>
      </div>
      <div className="field"><label htmlFor="desc">Deskripsi (opsional)</label><input id="desc" className="input" value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={350} /></div>

      <label className="radio-card"><input type="radio" name="vis" checked={!f.priv} onChange={() => set("priv", false)} /><Globe size={20} className="icon muted" /><span><strong>Public</strong><span className="hint" style={{ display: "block" }}>Siapa saja bisa melihat repository ini.</span></span></label>
      <label className="radio-card"><input type="radio" name="vis" checked={f.priv} onChange={() => set("priv", true)} /><Lock size={20} className="icon muted" /><span><strong>Private</strong><span className="hint" style={{ display: "block" }}>Kamu yang memilih siapa yang bisa melihat dan commit.</span></span></label>

      <div className="box box-body mt-3">
        <label className="check"><input type="checkbox" checked={f.readme} onChange={(e) => set("readme", e.target.checked)} /><span><strong>Tambahkan README</strong><span className="hint" style={{ display: "block" }}>Tanpa README repo kosong, lalu kamu bisa langsung upload folder/ZIP.</span></span></label>
        <div className="row-fields mt-2">
          <div className="field" style={{ marginBottom: 0 }}><label htmlFor="gi">.gitignore</label><select id="gi" className="select" value={f.gitignore} onChange={(e) => set("gitignore", e.target.value)} disabled={!f.readme}><option value="">Tidak ada</option>{gitignores.map((g) => <option key={g}>{g}</option>)}</select></div>
          <div className="field" style={{ marginBottom: 0 }}><label htmlFor="lic">Lisensi</label><select id="lic" className="select" value={f.license} onChange={(e) => set("license", e.target.value)} disabled={!f.readme}><option value="">Tidak ada</option>{licenses.map((l) => <option key={l.key} value={l.key}>{l.name}</option>)}</select></div>
        </div>
      </div>
      <div className="mt-3"><button className="btn btn-primary" disabled={busy || !valid || avail === "taken"}><BtnIcon busy={busy} icon={BookPlus} />Buat repository</button></div>
    </form>
  );
}
