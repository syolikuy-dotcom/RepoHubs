import Link from "next/link";
import { BookMarked, CircleDot, FileCode, Search, SearchX, Users } from "lucide-react";
import { gh } from "@/lib/github";
import { RepoList } from "@/components/RepoList";
import IssueList from "@/components/repo/IssueList";
import { Avatar, Empty, PageTitle, Pager, SearchField, one, pageNum } from "@/components/ui/common";

export const metadata = { title: "Pencarian" };
const TYPES = { repositories: "Repository", code: "Kode", issues: "Issue & pull request", users: "Pengguna" };
const TYPE_ICON = { repositories: BookMarked, code: FileCode, issues: CircleDot, users: Users };

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const scope = /^[\w.-]+\/[\w.-]+$/.test(one(sp.repo) || "") ? one(sp.repo) : "";
  const q = (one(sp.q) || "").trim().slice(0, 256);
  const type = TYPES[one(sp.type)] ? one(sp.type) : "repositories";
  const page = pageNum(sp.page);
  let res = null, error = "";
  if (q) {
    try { res = await gh(`/search/${type}?q=${encodeURIComponent(scope ? `${q} repo:${scope}` : q)}&per_page=20&page=${page}`); }
    catch (e) { error = e.message; }
  }
  return (
    <div className="container page">
      <div className="page-head"><PageTitle icon={Search}>Pencarian</PageTitle></div>
      <form action="/search" className="toolbar"><input type="hidden" name="type" value={type} />{scope && <input type="hidden" name="repo" value={scope} />}
        <SearchField className="grow" name="q" defaultValue={q} placeholder="Cari di GitHub…" label="Kata kunci" autoFocus={!q} />
        <button className="btn btn-primary"><Search size={14} className="icon" />Cari</button></form>
      {scope && <p className="muted">Mencari hanya di <Link href={`/${scope}`}>{scope}</Link> · <Link href={`/search?type=${type}&q=${encodeURIComponent(q)}`}>cari di semua</Link></p>}
      <div className="layout layout-side-main">
        <aside className="side-nav">{Object.entries(TYPES).map(([k, v]) => { const I = TYPE_ICON[k]; return <Link key={k} href={`/search?type=${k}&q=${encodeURIComponent(q)}`} className={type === k ? "active" : ""}><I size={16} aria-hidden="true" />{v}</Link>; })}</aside>
        <section>
          {error && <div className="flash error">{error}</div>}
          {!q && <div className="box"><Empty icon={Search} title="Mulai mencari">Gunakan qualifier seperti <code>user:nama</code>, <code>language:go</code>, atau <code>topic:nextjs</code>.</Empty></div>}
          {res && <>
            <h2 className="section-title" style={{ marginBottom: 12 }}>{res.total_count.toLocaleString("id-ID")} hasil</h2>
            {type === "repositories" && (res.items.length ? <RepoList repos={res.items} /> : <div className="box"><Empty icon={SearchX} title="Tidak ada repository" /></div>)}
            {type === "issues" && <IssueList items={res.items} showRepo />}
            {type === "users" && (res.items.length ? <div className="box">{res.items.map((u) => <div className="box-row" key={u.id} style={{ alignItems: "center" }}><Avatar src={u.avatar_url} size={40} /><Link href={`/${u.login}`} className="bold grow">{u.login}</Link><span className="pill">{u.type === "Organization" ? "Organisasi" : "Pengguna"}</span></div>)}</div> : <div className="box"><Empty icon={SearchX} title="Tidak ada pengguna" /></div>)}
            {type === "code" && (res.items.length ? <div className="box">{res.items.map((c) => <div className="box-row" key={c.sha + c.path} style={{ alignItems: "center" }}><FileCode size={16} className="icon muted" /><Link className="wrap-any bold" href={`/${c.repository.full_name}/blob/${encodeURIComponent(c.repository.default_branch || "HEAD")}/${c.path.split("/").map(encodeURIComponent).join("/")}`}>{c.repository.full_name}/{c.path}</Link></div>)}</div> : <div className="box"><Empty icon={SearchX} title="Tidak ada kode yang cocok" /></div>)}
            <Pager base="/search" params={{ type, q, repo: scope }} page={page} hasNext={res.total_count > page * 20 && page < 50} />
          </>}
        </section>
      </div>
    </div>
  );
}
