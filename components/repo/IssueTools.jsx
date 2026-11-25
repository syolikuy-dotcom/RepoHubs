"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleDot, GitMerge, GitPullRequest, MessageSquare, Tag } from "lucide-react";
import { api } from "@/lib/client";
import MarkdownEditor from "@/components/ui/MarkdownEditor";
import Dropdown from "@/components/ui/Dropdown";
import { BtnIcon, GhLabel } from "@/components/ui/common";
import { useAction } from "@/components/ui/useAction";

export function CommentForm({ repo, number, state, isPR, merged }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [body, setBody] = useState("");
  const noun = isPR ? "pull request" : "issue";
  const send = async () => {
    const r = await run(() => api(`/repos/${repo}/issues/${number}/comments`, { method: "POST", body: { body } }), "Komentar terkirim.");
    if (r.ok) { setBody(""); router.refresh(); }
  };
  const toggle = async () => {
    const next = state === "open" ? "closed" : "open";
    const r = await run(async () => {
      if (body.trim()) await api(`/repos/${repo}/issues/${number}/comments`, { method: "POST", body: { body } });
      return api(`/repos/${repo}/issues/${number}`, { method: "PATCH", body: { state: next, ...(next === "closed" ? { state_reason: "completed" } : {}) } });
    }, next === "closed" ? `${noun} ditutup.` : `${noun} dibuka kembali.`);
    if (r.ok) { setBody(""); router.refresh(); }
  };
  return (
    <div>
      <MarkdownEditor value={body} onChange={setBody} placeholder="Tinggalkan komentar" rows={5} />
      <div className="flex gap-2 mt-2" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
        {!merged && <button className="btn" onClick={toggle} disabled={busy}><BtnIcon icon={state === "open" ? CircleCheck : CircleDot} />{state === "open" ? (body.trim() ? "Tutup dengan komentar" : `Tutup ${noun}`) : `Buka kembali ${noun}`}</button>}
        <button className="btn btn-primary" onClick={send} disabled={busy || !body.trim()}><BtnIcon busy={busy} icon={MessageSquare} />Komentar</button>
      </div>
    </div>
  );
}

export function LabelsEditor({ repo, number, labels, all, canEdit }) {
  const router = useRouter();
  const [run] = useAction();
  const current = new Set(labels.map((l) => l.name));
  const save = async (next) => { const r = await run(() => api(`/repos/${repo}/issues/${number}/labels`, { method: "PUT", body: { labels: next } })); if (r.ok) router.refresh(); };
  return (
    <div>
      <div className="flex wrap gap-1">{labels.length ? labels.map((l) => <GhLabel key={l.id} name={l.name} color={l.color} />) : <span className="muted text-sm">Belum ada</span>}</div>
      {canEdit && all.length > 0 && (
        <div className="mt-2"><Dropdown icon={<Tag size={14} className="icon" />} label="Atur label" className="btn btn-sm btn-ghost" width={240}>
          <div className="dd-scroll">{all.map((l) => (
            <button key={l.id} className="dd-item" onClick={() => { const n = new Set(current); n.has(l.name) ? n.delete(l.name) : n.add(l.name); save([...n]); }}>
              <input type="checkbox" readOnly checked={current.has(l.name)} tabIndex={-1} /><span className="truncate">{l.name}</span>
            </button>))}</div>
        </Dropdown></div>
      )}
    </div>
  );
}

export function NewIssueForm({ repo, labels }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sel, setSel] = useState([]);
  const submit = async (e) => {
    e.preventDefault();
    const r = await run(() => api(`/repos/${repo}/issues`, { method: "POST", body: { title: title.trim(), body, labels: sel } }), "Issue dibuat.");
    if (r.ok) router.push(`/${repo}/issues/${r.result.number}`);
  };
  return (
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="it">Judul *</label><input id="it" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={256} required autoFocus /></div>
      <div className="field"><label>Deskripsi</label><MarkdownEditor value={body} onChange={setBody} rows={8} /></div>
      {labels.length > 0 && <div className="field"><span className="label-text">Label</span><div className="flex wrap gap-2">{labels.map((l) => (
        <label key={l.id} className="check" style={{ margin: 0 }}><input type="checkbox" checked={sel.includes(l.name)} onChange={(e) => setSel(e.target.checked ? [...sel, l.name] : sel.filter((x) => x !== l.name))} /><GhLabel name={l.name} color={l.color} /></label>))}</div></div>}
      <button className="btn btn-primary" disabled={busy || !title.trim()}><BtnIcon busy={busy} icon={CircleDot} />Buat issue</button>
    </form>
  );
}

export function MergeBox({ repo, pr, allow, canPush, sameRepo }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const methods = [["merge", "Buat merge commit", allow.merge], ["squash", "Squash dan merge", allow.squash], ["rebase", "Rebase dan merge", allow.rebase]].filter((m) => m[2] !== false);
  const [method, setMethod] = useState(methods[0]?.[0] || "merge");
  const [del, setDel] = useState(false);
  const blocked = pr.mergeable === false || pr.draft;
  const go = async () => {
    const r = await run(() => api(`/repos/${repo}/pulls/${pr.number}/merge`, { method: "PUT", body: { merge_method: method } }), "Pull request di-merge.");
    if (!r.ok) return;
    if (del && sameRepo) await run(() => api(`/repos/${repo}/git/refs/heads/${pr.head.ref.split("/").map(encodeURIComponent).join("/")}`, { method: "DELETE" }), "Branch dihapus.");
    router.refresh();
  };
  const msg = pr.draft ? "Masih draft, tandai siap review dulu di GitHub." : pr.mergeable === false ? "Ada konflik yang harus diselesaikan sebelum merge." : pr.mergeable === null ? "GitHub masih memeriksa kemungkinan merge…" : "Tidak ada konflik dengan branch dasar.";
  return (
    <div className="box mb-3">
      <div className="box-body">
        <div className="flex items-center gap-2 mb-3"><GitMerge size={20} className="icon" style={{ color: blocked ? "var(--fg-muted)" : "var(--success)" }} /><div><strong>{blocked ? "Belum bisa di-merge" : "Siap di-merge"}</strong><div className="muted text-sm">{msg}</div></div></div>
        {canPush ? (
          <div className="flex gap-2 wrap items-center">
            <select className="select" style={{ width: "auto" }} value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Metode merge">{methods.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <button className="btn btn-primary" onClick={go} disabled={busy || blocked}><BtnIcon busy={busy} icon={GitMerge} />Merge pull request</button>
            {sameRepo && <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={del} onChange={(e) => setDel(e.target.checked)} />Hapus branch <code>{pr.head.ref}</code></label>}
          </div>
        ) : <span className="muted text-sm">Kamu tidak punya akses untuk me-merge.</span>}
      </div>
    </div>
  );
}

export function CreatePR({ repo, base, head, defaultTitle }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState("");
  const [draft, setDraft] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const r = await run(() => api(`/repos/${repo}/pulls`, { method: "POST", body: { title: title.trim(), head, base, body, draft } }), "Pull request dibuat.");
    if (r.ok) router.push(`/${repo}/pull/${r.result.number}`);
  };
  return (
    <form onSubmit={submit} className="box box-body mb-3">
      <div className="field"><label htmlFor="pt">Judul *</label><input id="pt" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={256} /></div>
      <div className="field"><label>Deskripsi</label><MarkdownEditor value={body} onChange={setBody} rows={6} /></div>
      <div className="flex gap-3 items-center wrap">
        <button className="btn btn-primary" disabled={busy || !title.trim()}><BtnIcon busy={busy} icon={GitPullRequest} />Buat pull request</button>
        <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} />Buat sebagai draft</label>
      </div>
    </form>
  );
}
