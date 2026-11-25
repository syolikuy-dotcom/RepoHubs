import Link from "next/link";
import { ChevronLeft, ChevronRight, CircleAlert, CircleCheck, CircleDot, GitMerge, GitPullRequest, GitPullRequestClosed, GitPullRequestDraft, Globe, Info, LoaderCircle, Lock, Search, TriangleAlert } from "lucide-react";
import { langColor } from "@/lib/utils";

export function Avatar({ src, size = 20, alt = "", square = false }) {
  if (!src) return <span className={`avatar${square ? " avatar-sq" : ""}`} style={{ width: size, height: size, display: "inline-block" }} />;
  const url = `${src}${src.includes("?") ? "&" : "?"}s=${size * 2}`;
  return <img className={`avatar${square ? " avatar-sq" : ""}`} src={url} width={size} height={size} alt={alt} loading="lazy" />;
}

/** Ikon tombol: spinner saat sibuk, kalau tidak ikon biasa. Ukuran 14 (diseragamkan CSS). */
export function BtnIcon({ busy = false, icon: Icon }) {
  if (busy) return <LoaderCircle size={14} className="spin" aria-hidden="true" />;
  return Icon ? <Icon size={14} className="icon" aria-hidden="true" /> : null;
}

/** Judul halaman dengan ikon lucide. */
export function PageTitle({ icon: Icon, children, small = false }) {
  return <h1 className={`page-title${small ? " sm" : ""}`}>{Icon && <Icon size={small ? 20 : 24} className="title-ico" aria-hidden="true" />}<span className="wrap-any">{children}</span></h1>;
}

/** Judul bagian (h2) dengan ikon kecil opsional. */
export function SectionTitle({ icon: Icon, children, className = "" }) {
  return <h2 className={`section-title ${className}`}>{Icon && <Icon size={16} aria-hidden="true" />}{children}</h2>;
}

const FLASH_ICON = { error: CircleAlert, ok: CircleCheck, warn: TriangleAlert, info: Info, done: GitMerge };

export function Flash({ type = "info", children }) {
  const Icon = FLASH_ICON[type] || Info;
  return <div className={`flash ${type}`} role={type === "error" ? "alert" : undefined}><Icon size={16} className="icon" aria-hidden="true" /><div className="grow">{children}</div></div>;
}

export function Empty({ icon: Icon, title, children, compact = false }) {
  return (
    <div className={`blank${compact ? " compact" : ""}`}>
      {Icon && <span className="blank-ico"><Icon size={32} aria-hidden="true" /></span>}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

export function VisBadge({ isPrivate }) {
  return <span className="pill">{isPrivate ? <Lock size={12} aria-hidden="true" /> : <Globe size={12} aria-hidden="true" />}{isPrivate ? "Private" : "Public"}</span>;
}

export function StateIcon({ issue }) {
  const pr = !!issue.pull_request;
  const merged = !!(issue.pull_request?.merged_at || issue.merged);
  if (pr) {
    if (merged) return <GitMerge size={16} className="icon" style={{ color: "var(--done)" }} />;
    if (issue.state === "closed") return <GitPullRequestClosed size={16} className="icon" style={{ color: "var(--danger)" }} />;
    if (issue.draft) return <GitPullRequestDraft size={16} className="icon" style={{ color: "var(--fg-muted)" }} />;
    return <GitPullRequest size={16} className="icon" style={{ color: "var(--success)" }} />;
  }
  return issue.state === "closed"
    ? <CircleCheck size={16} className="icon" style={{ color: "var(--done)" }} />
    : <CircleDot size={16} className="icon" style={{ color: "var(--success)" }} />;
}

export function StateBadge({ issue }) {
  const merged = !!(issue.pull_request?.merged_at || issue.merged);
  const kind = merged ? "merged" : issue.draft ? "draft" : issue.state === "closed" ? "closed" : "open";
  const text = { merged: "Merged", draft: "Draft", closed: "Ditutup", open: "Terbuka" }[kind];
  return <span className={`state ${kind}`}><StateIcon issue={{ ...issue, state: kind === "closed" ? "closed" : issue.state }} />{text}</span>;
}

/** Tab status (Terbuka / Ditutup / Merged) di dalam .box-header. items: [{ href, label, icon, active }] */
export function StateTabs({ items }) {
  return (
    <>
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={`seg${i.active ? " active" : ""}`} aria-current={i.active ? "page" : undefined}>
          {i.icon && <i.icon size={16} className="icon" aria-hidden="true" />}{i.label}
        </Link>
      ))}
    </>
  );
}

/** Input pencarian dengan ikon lucide. Bisa terkontrol (value/onChange) atau tidak (defaultValue). */
export function SearchField({ label, className = "", inputClassName = "", style, ...rest }) {
  return (
    <div className={`input-icon ${className}`} style={style}>
      <Search size={15} aria-hidden="true" />
      <input type="search" className={`input ${inputClassName}`} aria-label={label} autoComplete="off" {...rest} />
    </div>
  );
}

export function GhLabel({ name, color = "8b949e" }) {
  const n = parseInt(color, 16);
  const lum = ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  const dark = lum < 140;
  return (
    <span className="gh-label" style={{ background: `#${color}${dark ? "" : "33"}`, color: dark ? "#fff" : `#${color}`, borderColor: `#${color}66`, filter: dark ? "none" : "brightness(.75) saturate(1.4)" }}>
      {name}
    </span>
  );
}

export function LangBar({ langs }) {
  const total = Object.values(langs || {}).reduce((a, b) => a + b, 0);
  if (!total) return null;
  const items = Object.entries(langs).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <div className="lang-bar" role="img" aria-label="Komposisi bahasa">
        {items.map(([l, b]) => <span key={l} style={{ width: `${(b / total) * 100}%`, background: langColor(l) }} title={l} />)}
      </div>
      <div className="flex wrap gap-3 mt-2 text-sm tabular">
        {items.slice(0, 6).map(([l, b]) => (
          <span key={l}><span className="lang-dot" style={{ background: langColor(l) }} /><strong>{l}</strong> <span className="muted">{((b / total) * 100).toFixed(1)}%</span></span>
        ))}
      </div>
    </>
  );
}

/** Pagination Sebelumnya/Berikutnya berbasis ?page= yang mempertahankan query lain. */
export function Pager({ base, params = {}, page = 1, hasNext }) {
  const href = (p) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null));
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `${base}${s ? `?${s}` : ""}`;
  };
  if (page <= 1 && !hasNext) return null;
  return (
    <nav className="pager" aria-label="Halaman">
      {page > 1 ? <Link className="btn" href={href(page - 1)}><ChevronLeft size={14} className="icon" />Sebelumnya</Link> : <span className="btn" aria-disabled="true"><ChevronLeft size={14} className="icon" />Sebelumnya</span>}
      {hasNext ? <Link className="btn" href={href(page + 1)}>Berikutnya<ChevronRight size={14} className="icon" /></Link> : <span className="btn" aria-disabled="true">Berikutnya<ChevronRight size={14} className="icon" /></span>}
    </nav>
  );
}

export const pageNum = (v) => Math.max(1, parseInt(Array.isArray(v) ? v[0] : v || "1", 10) || 1);
export const one = (v) => (Array.isArray(v) ? v[0] : v);
