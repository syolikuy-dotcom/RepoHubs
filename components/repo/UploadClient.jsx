"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudUpload, FileArchive, FilePlus, FolderUp, GitCommitHorizontal, ScanSearch, Trash2, X } from "lucide-react";
import { commitChanges, fetchTreeIndex, gitBlobSha, MAX_FILE_BYTES } from "@/lib/git-client";
import { fmtBytes } from "@/lib/utils";
import { useAction } from "@/components/ui/useAction";
import { BtnIcon, Flash, PageTitle } from "@/components/ui/common";

const JUNK = /(^|\/)(\.git|node_modules|__MACOSX|\.next|\.vercel)(\/|$)|(^|\/)(\.DS_Store|Thumbs\.db)$/;
const MAX_ENTRIES = 5000;
let counter = 0;

const fromFile = (file, path) => ({ id: ++counter, path, size: file.size, read: async () => new Uint8Array(await file.arrayBuffer()) });
const clean = (p) => p.replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter((s) => s && s !== "." && s !== "..").join("/");

async function walk(entry, base = "") {
  if (entry.isFile) {
    const file = await new Promise((res, rej) => entry.file(res, rej));
    return [fromFile(file, base + entry.name)];
  }
  const reader = entry.createReader();
  const all = [];
  for (;;) {
    const batch = await new Promise((res, rej) => reader.readEntries(res, rej));
    if (!batch.length) break;
    all.push(...batch);
  }
  return (await Promise.all(all.map((e) => walk(e, `${base}${entry.name}/`)))).flat();
}

async function unzip(file) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);
  const out = [];
  zip.forEach((rel, entry) => {
    if (entry.dir) return;
    const p = clean(rel);
    if (p) out.push({ id: ++counter, path: p, size: entry._data?.uncompressedSize ?? 0, read: () => entry.async("uint8array") });
  });
  return out;
}

export default function UploadClient({ owner, repo, defaultBranch, branches, initialRef, initialDir, login, empty }) {
  const router = useRouter();
  const [run, busy] = useAction();
  const full = `${owner}/${repo}`;
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [branch, setBranch] = useState(initialRef);
  const [dir, setDir] = useState(initialDir);
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState("direct");
  const [newBranch, setNewBranch] = useState(`${login}-upload-${Math.floor(Math.random() * 9000 + 1000)}`);
  const [opts, setOpts] = useState({ junk: true, strip: true, extract: true, skipSame: true });
  const [analysis, setAnalysis] = useState(null);
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(null);
  const fileRef = useRef(null), dirRef = useRef(null), zipRef = useRef(null);

  const add = useCallback(async (list) => {
    setAnalysis(null); setDone(null);
    const next = [];
    for (const it of list) {
      if (opts.extract && it.__zip) next.push(...(await unzip(it.__zip))); else next.push(it);
    }
    setItems((cur) => {
      const map = new Map(cur.map((i) => [i.path, i]));
      for (const i of next) map.set(i.path, i);
      const merged = [...map.values()];
      if (merged.length > MAX_ENTRIES) { setNotice(`Maksimal ${MAX_ENTRIES} file per commit. Sisanya diabaikan.`); return merged.slice(0, MAX_ENTRIES); }
      setNotice("");
      return merged;
    });
  }, [opts.extract]);

  const onFiles = async (fileList, useRel) => {
    const arr = [...fileList].map((f) => (opts.extract && /\.zip$/i.test(f.name) ? { __zip: f } : fromFile(f, useRel && f.webkitRelativePath ? f.webkitRelativePath : f.name)));
    try { await add(arr); } catch { setNotice("Gagal membaca ZIP. Pastikan file tidak rusak atau terproteksi password."); }
  };

  const onDrop = async (e) => {
    e.preventDefault(); setDragging(false);
    const entries = [...e.dataTransfer.items].map((i) => i.webkitGetAsEntry?.()).filter(Boolean);
    const files = [...e.dataTransfer.files];
    try {
      if (entries.length) {
        const nested = (await Promise.all(entries.map((en) => walk(en)))).flat();
        const zips = nested.filter((i) => opts.extract && /\.zip$/i.test(i.path) && !i.path.includes("/"));
        const rest = nested.filter((i) => !zips.includes(i));
        const zipFiles = files.filter((f) => opts.extract && /\.zip$/i.test(f.name)).map((f) => ({ __zip: f }));
        await add([...rest, ...zipFiles]);
      } else await onFiles(files, false);
    } catch { setNotice("Gagal membaca file yang di-drop."); }
  };

  // path final setelah filter/strip/prefix
  const plan = useMemo(() => {
    let list = items.map((i) => ({ ...i, rel: clean(i.path) })).filter((i) => i.rel);
    if (opts.junk) list = list.filter((i) => !JUNK.test(i.rel));
    const roots = new Set(list.map((i) => i.rel.split("/")[0]));
    const canStrip = roots.size === 1 && list.every((i) => i.rel.includes("/"));
    const prefix = clean(dir);
    return {
      canStrip,
      files: list.map((i) => {
        const p = opts.strip && canStrip ? i.rel.split("/").slice(1).join("/") : i.rel;
        return { ...i, dest: prefix ? `${prefix}/${p}` : p };
      }),
    };
  }, [items, opts.junk, opts.strip, dir]);

  const total = plan.files.reduce((a, b) => a + b.size, 0);
  const tooBig = plan.files.filter((f) => f.size > MAX_FILE_BYTES);
  const sendable = plan.files.filter((f) => f.size <= MAX_FILE_BYTES);
  const dup = plan.files.length - new Set(plan.files.map((f) => f.dest)).size;

  const analyze = async () => {
    const r = await run(async () => {
      const { map, truncated } = branches.includes(branch) ? await fetchTreeIndex(full, branch) : { map: new Map(), truncated: false };
      const status = new Map();
      for (const f of sendable) {
        const bytes = f.bytes || (f.bytes = await f.read());
        const sha = await gitBlobSha(bytes);
        const old = map.get(f.dest);
        status.set(f.dest, !old ? "new" : old === sha ? "same" : "modified");
      }
      setAnalysis({ status, truncated });
      return status;
    });
    return r.ok ? r.result : null;
  };

  const commit = async () => {
    let status = analysis?.status;
    if (!status) status = await analyze();
    if (!status) return;
    const todo = sendable.filter((f) => !(opts.skipSame && status.get(f.dest) === "same"));
    if (!todo.length) { setNotice("Semua file sama dengan isi branch. Tidak ada yang perlu di-commit."); return; }
    const target = mode === "direct" ? branch : newBranch.trim();
    setProgress({ done: 0, total: todo.length });
    const r = await run(async () => {
      const changes = [];
      for (const f of todo) changes.push({ path: f.dest, bytes: f.bytes || (f.bytes = await f.read()) });
      return commitChanges(changes, { repo: full, branch: target, baseBranch: branch, message: msg.trim() || `Upload ${todo.length} file via RepoHub`, onProgress: (d, t) => setProgress({ done: d, total: t }) });
    });
    setProgress(null);
    if (r.ok) {
      setDone({ sha: r.result.sha, branch: target, count: todo.length, skipped: sendable.length - todo.length });
      setItems([]); setAnalysis(null);
      router.refresh();
    }
  };

  const counts = analysis ? [...analysis.status.values()].reduce((a, s) => ((a[s] = (a[s] || 0) + 1), a), {}) : null;
  const canCommit = sendable.length > 0 && !busy && dup === 0 && (mode === "direct" || newBranch.trim());

  return (
    <div className="mw-900">
      <PageTitle icon={CloudUpload} small>Upload ke {repo}</PageTitle>
      <p className="muted mt-1 mb-3">Seret folder atau ZIP ke sini. Semua file masuk dalam satu commit.</p>

      {done && <Flash type="ok"><strong>{done.count} file</strong> berhasil di-commit ke <code>{done.branch}</code>{done.skipped > 0 && ` (${done.skipped} file sama dilewati)`}. <Link href={`/${full}/commit/${done.sha}`}>Lihat commit</Link>{done.branch !== branch && <> · <Link href={`/${full}/compare?base=${encodeURIComponent(defaultBranch)}&head=${encodeURIComponent(done.branch)}`}>Buat pull request</Link></>}</Flash>}
      {notice && <Flash type="warn">{notice}</Flash>}

      <div className={`dropzone ${dragging ? "active" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
        <CloudUpload size={36} aria-hidden="true" />
        <p style={{ margin: "8px 0 16px" }}>Seret file, folder, atau ZIP ke area ini</p>
        <div className="flex gap-2 wrap" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={() => fileRef.current.click()} disabled={busy}><FilePlus size={14} className="icon" />Pilih file</button>
          <button className="btn" onClick={() => dirRef.current.click()} disabled={busy}><FolderUp size={14} className="icon" />Pilih folder</button>
          <button className="btn" onClick={() => zipRef.current.click()} disabled={busy}><FileArchive size={14} className="icon" />Pilih ZIP</button>
        </div>
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => { onFiles(e.target.files, false); e.target.value = ""; }} />
        <input ref={dirRef} type="file" hidden webkitdirectory="" directory="" multiple onChange={(e) => { onFiles(e.target.files, true); e.target.value = ""; }} />
        <input ref={zipRef} type="file" accept=".zip,application/zip" hidden onChange={(e) => { onFiles(e.target.files, false); e.target.value = ""; }} />
      </div>

      {plan.files.length > 0 && (
        <div className="box mt-3">
          <div className="box-header">
            <span className="box-title">{plan.files.length} file · {fmtBytes(total)}</span>
            {counts && <span className="text-sm"><span className="add-t">{counts.new || 0} baru</span> · <span style={{ color: "var(--attention)" }}>{counts.modified || 0} berubah</span> · <span className="muted">{counts.same || 0} sama</span></span>}
            <span className="grow" />
            <button className="btn btn-sm" onClick={analyze} disabled={busy}><BtnIcon busy={busy} icon={ScanSearch} />Periksa perubahan</button>
            <button className="btn btn-sm btn-ghost" onClick={() => { setItems([]); setAnalysis(null); }} disabled={busy}><Trash2 size={14} className="icon" />Kosongkan</button>
          </div>
          <div className="code-scroll" style={{ maxHeight: 300 }}>
            {plan.files.slice(0, 500).map((f) => {
              const st = analysis?.status.get(f.dest);
              return (
                <div className="box-row" key={f.id} style={{ padding: "6px 16px", alignItems: "center" }}>
                  <span className="mono grow wrap-any" style={{ fontSize: 12 }}>{f.dest}</span>
                  {f.size > MAX_FILE_BYTES && <span className="pill bad">&gt; {MAX_FILE_BYTES / 1048576}MB</span>}
                  {st && <span className={`pill ${st === "new" ? "ok" : st === "modified" ? "warn" : ""}`}>{st === "new" ? "Baru" : st === "modified" ? "Berubah" : "Sama"}</span>}
                  <span className="muted text-sm shrink0">{fmtBytes(f.size)}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setItems((c) => c.filter((i) => i.id !== f.id)); setAnalysis(null); }} aria-label={`Hapus ${f.dest}`}><X size={14} /></button>
                </div>
              );
            })}
            {plan.files.length > 500 && <div className="box-body muted text-sm">+{plan.files.length - 500} file lain tidak ditampilkan.</div>}
          </div>
        </div>
      )}
      {tooBig.length > 0 && <Flash type="warn">{tooBig.length} file melebihi {MAX_FILE_BYTES / 1048576}MB dan akan dilewati (batas request serverless). Upload file besar lewat git CLI atau Git LFS.</Flash>}
      {dup > 0 && <Flash type="error">Ada {dup} file dengan tujuan path yang sama. Hapus salah satunya.</Flash>}

      <div className="box box-body mt-3">
        <h2 className="section-title">Opsi</h2>
        <label className="check"><input type="checkbox" checked={opts.extract} onChange={(e) => setOpts({ ...opts, extract: e.target.checked })} />Ekstrak file ZIP otomatis</label>
        <label className="check"><input type="checkbox" checked={opts.junk} onChange={(e) => setOpts({ ...opts, junk: e.target.checked })} />Abaikan file sampah (.git, node_modules, .next, __MACOSX, .DS_Store)</label>
        <label className="check" style={{ opacity: plan.canStrip ? 1 : .5 }}><input type="checkbox" disabled={!plan.canStrip} checked={opts.strip && plan.canStrip} onChange={(e) => setOpts({ ...opts, strip: e.target.checked })} />Buang folder induk tunggal (isi folder langsung ke tujuan)</label>
        <label className="check"><input type="checkbox" checked={opts.skipSame} onChange={(e) => setOpts({ ...opts, skipSame: e.target.checked })} />Lewati file yang isinya sama dengan di branch</label>
        <div className="row-fields mt-3">
          <div className="field" style={{ marginBottom: 0 }}><label htmlFor="ub">Branch asal</label>
            <select id="ub" className="select" value={branch} onChange={(e) => { setBranch(e.target.value); setAnalysis(null); }}>{(branches.length ? branches : [branch]).map((b) => <option key={b}>{b}</option>)}</select></div>
          <div className="field" style={{ marginBottom: 0 }}><label htmlFor="ud">Folder tujuan</label>
            <input id="ud" className="input mono" placeholder="(root repository)" value={dir} onChange={(e) => { setDir(e.target.value); setAnalysis(null); }} spellCheck={false} /></div>
        </div>
      </div>

      <div className="box box-body mt-3">
        <h2 className="section-title">Commit</h2>
        <div className="field"><label htmlFor="um">Pesan commit</label><input id="um" className="input" placeholder={`Upload ${sendable.length || "N"} file via RepoHub`} value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
        <label className="radio-card"><input type="radio" checked={mode === "direct"} onChange={() => setMode("direct")} /><span>Commit langsung ke <code>{branch}</code>{empty && " (repo kosong, branch dibuat otomatis)"}</span></label>
        <label className="radio-card"><input type="radio" checked={mode === "branch"} onChange={() => setMode("branch")} /><span style={{ flex: 1 }}>Buat branch baru dari <code>{branch}</code>
          {mode === "branch" && <input className="input mono mt-2" aria-label="Nama branch baru" value={newBranch} onChange={(e) => setNewBranch(e.target.value.trim())} />}</span></label>
        {progress && (
          <div className="mb-3" aria-live="polite"><div className="flex between text-sm mb-2"><span>Mengunggah…</span><span>{progress.done}/{progress.total}</span></div>
            <div className="progress"><i style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} /></div></div>
        )}
        <button className="btn btn-primary" onClick={commit} disabled={!canCommit}><BtnIcon busy={busy} icon={GitCommitHorizontal} />Commit {sendable.length ? `${sendable.length} file` : ""}</button>
      </div>
    </div>
  );
}
