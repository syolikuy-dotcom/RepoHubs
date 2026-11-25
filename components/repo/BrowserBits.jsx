"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Code, Copy, Download, FilePlus, GitBranch, Tag, Terminal, Upload, LoaderCircle, Plus } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import { api, createQueue } from "@/lib/client";
import { repoUrl, timeAgo, encPath } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { SearchField } from "@/components/ui/common";

/* ---- pilih branch / tag ---- */
function RefList({ owner, repo, current, kind, path, onPick }) {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("branches");
  useEffect(() => {
    let live = true;
    Promise.all([
      api(`/repos/${owner}/${repo}/branches?per_page=100`).catch(() => []),
      api(`/repos/${owner}/${repo}/tags?per_page=100`).catch(() => []),
    ]).then(([b, t]) => live && setData({ branches: b.map((x) => x.name), tags: t.map((x) => x.name) }));
    return () => { live = false; };
  }, [owner, repo]);
  const list = (data?.[tab] || []).filter((n) => n.toLowerCase().includes(q.toLowerCase()));
  const target = kind === "tree" || kind === "blob" ? "tree" : kind;
  return (
    <div>
      <div className="dd-head">Pilih branch atau tag</div>
      <div style={{ padding: "0 12px 8px" }}><SearchField inputClassName="sm" autoFocus placeholder="Cari…" value={q} onChange={(e) => setQ(e.target.value)} label="Cari branch atau tag" /></div>
      <div className="flex gap-1" style={{ padding: "0 12px 8px" }}>
        <button className={`btn btn-sm ${tab === "branches" ? "" : "btn-ghost"}`} onClick={() => setTab("branches")}><GitBranch size={14} className="icon" />Branch</button>
        <button className={`btn btn-sm ${tab === "tags" ? "" : "btn-ghost"}`} onClick={() => setTab("tags")}><Tag size={14} className="icon" />Tag</button>
      </div>
      <div className="dd-scroll">
        {!data && <div className="center muted" style={{ padding: 12 }}><LoaderCircle size={16} className="spin" /></div>}
        {data && !list.length && <div className="muted text-sm" style={{ padding: "8px 16px" }}>Tidak ada hasil.</div>}
        {list.map((n) => (
          <Link key={n} className="dd-item" href={target === "tree" ? repoUrl(owner, repo, "tree", n, kind === "tree" ? path : "") : repoUrl(owner, repo, target, n, path)} onClick={onPick}>
            <Check size={14} className="icon" style={{ visibility: n === current ? "visible" : "hidden" }} /><span className="truncate">{n}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BranchSelect({ owner, repo, current, kind = "tree", path = "", isTag }) {
  return (
    <Dropdown icon={isTag ? <Tag size={14} className="icon" /> : <GitBranch size={14} className="icon" />} label={<span className="truncate" style={{ maxWidth: 160 }}>{current}</span>} width={300} title="Ganti branch atau tag">
      {(close) => <RefList owner={owner} repo={repo} current={current} kind={kind} path={path} onPick={close} />}
    </Dropdown>
  );
}

/* ---- Code (clone) ---- */
export function CloneMenu({ fullName, refName }) {
  const [tab, setTab] = useState("https");
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const val = { https: `https://github.com/${fullName}.git`, ssh: `git@github.com:${fullName}.git`, cli: `gh repo clone ${fullName}` }[tab];
  const copy = async () => {
    try { await navigator.clipboard.writeText(val); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { toast("Gagal menyalin. Salin manual dari kolom.", "error"); }
  };
  return (
    <Dropdown icon={<Code size={14} className="icon" />} label="Kode" className="btn btn-primary" align="right" width={360}>
      <div style={{ padding: "6px 16px 8px" }}>
        <div className="flex items-center gap-2 mb-2"><Terminal size={15} className="icon" /><strong>Clone</strong></div>
        <div className="seg-tabs mb-2" style={{ width: "100%" }}>
          {[["https", "HTTPS"], ["ssh", "SSH"], ["cli", "GitHub CLI"]].map(([k, l]) => (
            <button key={k} type="button" className={`seg-tab grow ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1">
          <input className="input mono sm" style={{ fontSize: 12 }} readOnly value={val} onFocus={(e) => e.target.select()} aria-label="URL clone" />
          <button className="btn btn-sm" onClick={copy} aria-label="Salin">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
        </div>
      </div>
      <div className="dd-sep" />
      <a className="dd-item" href={`/api/zip?repo=${encodeURIComponent(fullName)}&ref=${encodeURIComponent(refName)}`}><Download size={16} className="icon" />Unduh ZIP</a>
    </Dropdown>
  );
}

export function AddFileMenu({ owner, repo, refName, path }) {
  return (
    <Dropdown icon={<Plus size={14} className="icon" />} label="Tambah file" align="right" width={230}>
      <Link className="dd-item" href={`/${owner}/${repo}/new/${encPath(refName)}${path ? `/${encPath(path)}` : ""}`}><FilePlus size={16} className="icon" />Buat file baru</Link>
      <Link className="dd-item" href={`/${owner}/${repo}/upload/${encPath(refName)}${path ? `/${encPath(path)}` : ""}`}><Upload size={16} className="icon" />Upload file / folder / ZIP</Link>
    </Dropdown>
  );
}

/* ---- commit terakhir per baris, dimuat lazy saat terlihat ---- */
const queue = createQueue(5);
const cache = new Map();

export function CommitCell({ repo, refName, path }) {
  const el = useRef(null);
  const [c, setC] = useState(() => cache.get(`${repo}|${refName}|${path}`) || null);
  useEffect(() => {
    if (c || !el.current) return;
    const key = `${repo}|${refName}|${path}`;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      queue(() => api(`/repos/${repo}/commits?sha=${encodeURIComponent(refName)}&path=${encodeURIComponent(path)}&per_page=1`))
        .then((r) => {
          const x = r[0] && { msg: r[0].commit.message.split("\n")[0], sha: r[0].sha, date: r[0].commit.author?.date };
          if (x) { cache.set(key, x); setC(x); }
        }).catch(() => {});
    }, { rootMargin: "120px" });
    io.observe(el.current);
    return () => io.disconnect();
  }, [c, repo, refName, path]);
  return (
    <>
      <div className="msg truncate" ref={el}>{c ? <Link href={`/${repo}/commit/${c.sha}`} title={c.msg}>{c.msg}</Link> : <span className="skeleton" style={{ display: "inline-block", width: "55%", height: 12 }} />}</div>
      <div className="when">{c ? timeAgo(c.date) : ""}</div>
    </>
  );
}
