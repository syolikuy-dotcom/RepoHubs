import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookOpen, Code, Eye, File, FileCode, FileText, Folder, FolderUp, GitBranch, GitFork, History, Image as ImageIcon, Info, PackageOpen, Scale, Star, Tag, FilePlus, Users } from "lucide-react";
import { gh, ghPage, safe } from "@/lib/github";
import { encPath, fmtNum, repoUrl, timeAgo, IMAGE_RE } from "@/lib/utils";
import { Avatar, Empty, LangBar, SearchField, SectionTitle } from "@/components/ui/common";
import Markdown from "@/components/ui/Markdown";
import { GoToFileButton } from "./FileFinder";
import { AddFileMenu, BranchSelect, CloneMenu, CommitCell } from "./BrowserBits";

function fileIcon(name) {
  if (IMAGE_RE.test(name)) return ImageIcon;
  if (/\.(md|txt|markdown)$/i.test(name)) return FileText;
  if (/\.(jsx?|tsx?|py|go|rs|java|c|cpp|cs|php|rb|sh|css|scss|html?|json|ya?ml|vue|svelte)$/i.test(name)) return FileCode;
  return File;
}

export function Crumbs({ owner, repo, kind = "tree", refName, path }) {
  const parts = path.split("/").filter(Boolean);
  return (
    <div className="crumbs">
      <Link href={repoUrl(owner, repo, "tree", refName)} className="bold">{repo}</Link>
      {parts.map((p, i) => {
        const to = parts.slice(0, i + 1).join("/");
        const last = i === parts.length - 1;
        return (
          <span key={to} className="flex items-center gap-1"><span className="sep">/</span>
            {last && kind === "blob" ? <strong>{p}</strong> : <Link href={repoUrl(owner, repo, last && kind === "blob" ? "blob" : "tree", refName, to)} className={last ? "bold" : ""} style={last ? { color: "var(--fg)" } : undefined}>{p}</Link>}
          </span>
        );
      })}
    </div>
  );
}

export default async function Browser({ r, refName, path }) {
  const owner = r.owner.login, repo = r.name, full = r.full_name;
  const ref = refName || r.default_branch;
  const q = `?ref=${encodeURIComponent(ref)}`;
  const isRoot = !path;
  const canPush = !!r.permissions?.push;

  let contents;
  try {
    contents = await gh(`/repos/${full}/contents${path ? `/${encPath(path)}` : ""}${q}`);
  } catch (e) {
    if (e.status === 404 && isRoot && !refName) {
      return (
        <div className="box"><Empty icon={PackageOpen} title="Repository ini masih kosong">Mulai dengan upload folder atau ZIP proyek kamu, atau buat file pertama.</Empty>
          {canPush && <div className="flex gap-2" style={{ justifyContent: "center", paddingBottom: 32 }}>
            <Link className="btn btn-primary" href={`/${full}/upload`}><FolderUp size={14} className="icon" />Upload file</Link>
            <Link className="btn" href={`/${full}/new/${encodeURIComponent(ref)}`}><FilePlus size={14} className="icon" />Buat file</Link></div>}
        </div>
      );
    }
    if (e.status === 404) notFound();
    throw e;
  }
  if (!Array.isArray(contents)) redirect(repoUrl(owner, repo, "blob", ref, path));

  const entries = [...contents].sort((a, b) => (a.type === "dir") === (b.type === "dir") ? a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) : a.type === "dir" ? -1 : 1);
  const readmeUrl = `/repos/${full}/readme${path ? `/${encPath(path)}` : ""}${q}`;

  const [last, readme, langs, contributors, release, branchPage, tagPage] = await Promise.all([
    safe(ghPage(`/repos/${full}/commits?sha=${encodeURIComponent(ref)}&per_page=1${path ? `&path=${encodeURIComponent(path)}` : ""}`), null),
    safe(gh(readmeUrl, { accept: "application/vnd.github.raw+json", text: true }), null),
    isRoot ? safe(gh(`/repos/${full}/languages`), {}) : null,
    isRoot ? safe(gh(`/repos/${full}/contributors?per_page=12`), []) : null,
    isRoot ? safe(gh(`/repos/${full}/releases/latest`), null) : null,
    safe(ghPage(`/repos/${full}/branches?per_page=1`), null),
    safe(ghPage(`/repos/${full}/tags?per_page=1`), null),
  ]);
  const lc = last?.data?.[0];
  const commitCount = last?.last ?? (lc ? 1 : 0);
  const nBranches = branchPage?.last ?? branchPage?.data?.length ?? 0;
  const nTags = tagPage?.last ?? tagPage?.data?.length ?? 0;
  const isTag = false;

  const main = (
    <div style={{ minWidth: 0 }}>
      <div className="toolbar">
        <BranchSelect owner={owner} repo={repo} current={ref} kind="tree" path={path} isTag={isTag} />
        <Link href={`/${full}/branches`} className="btn btn-ghost"><GitBranch size={14} className="icon" /><strong>{nBranches}</strong> Branch</Link>
        <Link href={`/${full}/releases`} className="btn btn-ghost"><Tag size={14} className="icon" /><strong>{nTags}</strong> Tag</Link>
        <span className="grow" />
        <GoToFileButton />
        {canPush && <AddFileMenu owner={owner} repo={repo} refName={ref} path={path} />}
        <CloneMenu fullName={full} refName={ref} />
      </div>
      {!isRoot && <div className="mb-3"><Crumbs owner={owner} repo={repo} refName={ref} path={path} /></div>}

      <div className="box">
        <div className="latest">
          {lc ? (
            <>
              <Avatar src={lc.author?.avatar_url} size={20} />
              <strong className="truncate shrink0" style={{ maxWidth: 140 }}>{lc.author?.login || lc.commit.author?.name}</strong>
              <Link href={`/${full}/commit/${lc.sha}`} className="truncate grow" style={{ color: "var(--fg-muted)" }}>{lc.commit.message.split("\n")[0]}</Link>
              <span className="muted shrink0 mono text-sm">{lc.sha.slice(0, 7)}</span>
              <span className="muted shrink0 text-sm">{timeAgo(lc.commit.author?.date)}</span>
              <Link href={repoUrl(owner, repo, "commits", ref, path)} className="btn btn-ghost btn-sm shrink0" style={{ color: "var(--fg)" }}><History size={14} className="icon" />{fmtNum(commitCount)}<span className="sr-only"> commit</span></Link>
            </>
          ) : <span className="muted">Belum ada commit.</span>}
        </div>
        {!isRoot && (
          <div className="ft-row"><Folder size={16} className="icon" style={{ color: "var(--brand)" }} /><div className="name"><Link href={repoUrl(owner, repo, "tree", ref, path.split("/").slice(0, -1).join("/"))}>..</Link></div><span /><span /></div>
        )}
        {entries.map((e) => {
          const Icon = e.type === "dir" ? Folder : fileIcon(e.name);
          const href = repoUrl(owner, repo, e.type === "dir" ? "tree" : "blob", ref, e.path);
          return (
            <div className="ft-row" key={e.sha + e.name}>
              <Icon size={16} className="icon" style={{ color: e.type === "dir" ? "var(--brand)" : "var(--fg-muted)" }} />
              <div className="name truncate"><Link href={href}>{e.name}</Link></div>
              <CommitCell repo={full} refName={ref} path={e.path} />
            </div>
          );
        })}
        {!entries.length && <div className="blank">Folder ini kosong.</div>}
      </div>

      {readme && (
        <div className="box mt-4">
          <div className="box-header"><BookOpen size={16} className="icon muted" /><span className="box-title">README</span></div>
          <div className="box-body" style={{ padding: "24px 32px" }}><Markdown ctx={{ owner, repo, ref, dir: path }}>{readme}</Markdown></div>
        </div>
      )}
    </div>
  );

  if (!isRoot) return main;
  return (
    <div className="layout layout-main-side">
      {main}
      <aside>
        <SectionTitle icon={Info}>Tentang</SectionTitle>
        <p className="wrap-any" style={{ marginTop: 0 }}>{r.description || <span className="muted">Tidak ada deskripsi.</span>}</p>
        {r.homepage && /^https?:\/\//i.test(r.homepage) && <p className="truncate"><a href={r.homepage} target="_blank" rel="noopener noreferrer nofollow">{r.homepage.replace(/^https?:\/\//, "")}</a></p>}
        {r.topics?.length > 0 && <div className="flex wrap gap-1 mb-3">{r.topics.map((t) => <Link key={t} className="topic" href={`/search?type=repositories&q=topic:${encodeURIComponent(t)}`}>{t}</Link>)}</div>}
        {r.license && <div className="kv"><Scale size={16} className="icon" />{r.license.spdx_id === "NOASSERTION" ? "Lisensi lain" : r.license.spdx_id}</div>}
        <div className="kv"><Star size={16} className="icon" /><Link href={`/${full}/stargazers`}><strong>{fmtNum(r.stargazers_count)}</strong> bintang</Link></div>
        <div className="kv"><Eye size={16} className="icon" /><strong>{fmtNum(r.subscribers_count ?? r.watchers_count)}</strong> pengamat</div>
        <div className="kv"><GitFork size={16} className="icon" /><Link href={`/${full}/forks`}><strong>{fmtNum(r.forks_count)}</strong> fork</Link></div>
        <form action="/search" className="mt-3"><input type="hidden" name="type" value="code" /><input type="hidden" name="repo" value={full} /><SearchField inputClassName="sm" name="q" placeholder="Cari kode di repo ini…" label="Cari kode di repo ini" /></form>

        {release && (
          <div className="mt-4"><SectionTitle icon={Tag}><Link href={`/${full}/releases`} className="fg-link">Rilis</Link></SectionTitle>
            <div className="flex items-center gap-2 wrap"><Tag size={16} className="icon" style={{ color: "var(--success)" }} /><strong className="wrap-any">{release.name || release.tag_name}</strong><span className="pill ok">Terbaru</span></div>
            <div className="muted text-sm">{timeAgo(release.published_at)}</div></div>
        )}
        {langs && Object.keys(langs).length > 0 && <div className="mt-4"><SectionTitle icon={Code}>Bahasa</SectionTitle><LangBar langs={langs} /></div>}
        {contributors?.length > 0 && (
          <div className="mt-4"><SectionTitle icon={Users}>Kontributor</SectionTitle>
            <div className="avatar-stack">{contributors.map((c) => <Link key={c.id} href={`/${c.login}`} title={c.login}><Avatar src={c.avatar_url} size={32} alt={c.login} /></Link>)}</div></div>
        )}
      </aside>
    </div>
  );
}
