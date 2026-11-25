import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, GitFork, Link2, MapPin, Plus, Search, Star, Users, BookMarked, LayoutGrid, Lock, Globe } from "lucide-react";
import { gh, ghPage, ghStatus, graphql, orNotFound, safe } from "@/lib/github";
import { requireSession } from "@/lib/session";
import { safeUrl, fmtNum } from "@/lib/utils";
import { RepoList } from "@/components/RepoList";
import { Avatar, Empty, Pager, SearchField, SectionTitle, one, pageNum } from "@/components/ui/common";
import Heatmap from "@/components/Heatmap";
import Markdown from "@/components/ui/Markdown";
import { FollowButton } from "@/components/ProfileTools";
import { langColor } from "@/lib/utils";

const PER = 20;
const SORTS = { updated: "Terakhir diperbarui", name: "Nama", stars: "Bintang terbanyak" };
const TYPES = { all: "Semua", sources: "Sumber", forks: "Fork", archived: "Archived", private: "Private", public: "Public" };

export async function generateMetadata({ params }) { return { title: (await params).owner }; }

async function allRepos(owner, self, isOrg) {
  const base = self ? `/user/repos?affiliation=owner&sort=pushed` : isOrg ? `/orgs/${owner}/repos?sort=pushed` : `/users/${owner}/repos?sort=pushed`;
  const out = [];
  for (let p = 1; p <= 5; p++) {
    const part = await gh(`${base}&per_page=100&page=${p}`);
    out.push(...part);
    if (part.length < 100) break;
  }
  return out;
}

export default async function Profile({ params, searchParams }) {
  const { owner } = await params;
  const sp = await searchParams;
  const s = await requireSession();
  const profile = await orNotFound(gh(`/users/${owner}`));
  if (!profile) notFound();
  const self = profile.login.toLowerCase() === s.user.login.toLowerCase();
  const isOrg = profile.type === "Organization";
  const tab = ["repositories", "stars"].includes(one(sp.tab)) ? one(sp.tab) : "overview";
  const year = /^\d{4}$/.test(one(sp.year) || "") ? Number(one(sp.year)) : 0;
  const page = pageNum(sp.page);
  const q = (one(sp.q) || "").trim().toLowerCase();
  const type = TYPES[one(sp.type)] ? one(sp.type) : "all";
  const sort = SORTS[one(sp.sort)] ? one(sp.sort) : "updated";
  const lang = one(sp.language) || "";

  let repos = [], hasNext = false, languages = [];
  let readme = null, pinned = [], orgs = [], following = false;
  const isUser = profile.type === "User";
  if (!self && isUser) following = (await ghStatus(`/user/following/${owner}`)) === 204;
  orgs = isUser ? await safe(gh(`/users/${owner}/orgs`), []) : [];
  if (tab === "overview") {
    [readme, pinned] = await Promise.all([
      isUser ? safe(gh(`/repos/${owner}/${owner}/readme`, { accept: "application/vnd.github.raw+json", text: true }), null) : null,
      isUser ? safe(graphql(`query($l:String!){user(login:$l){pinnedItems(first:6,types:REPOSITORY){nodes{... on Repository{nameWithOwner description stargazerCount forkCount isPrivate primaryLanguage{name}}}}}}`, { l: owner }).then((d) => d.user.pinnedItems.nodes.filter((n) => n.nameWithOwner)), []) : [],
    ]);
    if (!pinned.length) {
      const recent = await safe(gh(self ? "/user/repos?affiliation=owner&sort=pushed&per_page=6" : isOrg ? `/orgs/${owner}/repos?sort=pushed&per_page=6` : `/users/${owner}/repos?sort=pushed&per_page=6`), []);
      pinned = recent.map((x) => ({ nameWithOwner: x.full_name, description: x.description, stargazerCount: x.stargazers_count, forkCount: x.forks_count, isPrivate: x.private, primaryLanguage: x.language ? { name: x.language } : null }));
    }
  } else if (tab === "stars") {
    const r = await ghPage(`/users/${owner}/starred?per_page=${PER}&page=${page}`);
    repos = r.data; hasNext = !!r.next;
  } else if (tab === "repositories") {
    let list = await allRepos(owner, self, isOrg);
    languages = [...new Set(list.map((r) => r.language).filter(Boolean))].sort();
    list = list.filter((r) =>
      (!q || r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)) &&
      (!lang || r.language === lang) &&
      (type === "all" || (type === "sources" && !r.fork) || (type === "forks" && r.fork) || (type === "archived" && r.archived) || (type === "private" && r.private) || (type === "public" && !r.private)));
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "stars") list.sort((a, b) => b.stargazers_count - a.stargazers_count);
    hasNext = list.length > page * PER;
    repos = list.slice((page - 1) * PER, page * PER);
  }
  const blog = safeUrl(profile.blog);
  const params0 = { tab, q: one(sp.q), type: type === "all" ? "" : type, sort: sort === "updated" ? "" : sort, language: lang };

  return (
    <div className="container page">
      <div className="layout layout-side-main">
        <aside>
          <Avatar src={profile.avatar_url} size={260} alt={profile.login} />
          <h1 style={{ fontSize: 24, marginTop: 16, fontWeight: 600 }} className="wrap-any">{profile.name || profile.login}</h1>
          <div className="muted" style={{ fontSize: 20, fontWeight: 300 }}>{profile.login}</div>
          {profile.bio && <p className="wrap-any">{profile.bio}</p>}
          {!self && isUser && <div className="mt-3"><FollowButton login={profile.login} following={following} /></div>}
          <div className="kv mt-3"><Users size={16} className="icon" /><strong>{fmtNum(profile.followers)}</strong> pengikut · <strong>{fmtNum(profile.following)}</strong> mengikuti</div>
          {profile.company && <div className="kv"><Building2 size={16} className="icon" /><span className="wrap-any">{profile.company}</span></div>}
          {profile.location && <div className="kv"><MapPin size={16} className="icon" /><span className="wrap-any">{profile.location}</span></div>}
          {orgs.length > 0 && <div className="mt-3"><strong className="text-sm">Organisasi</strong><div className="avatar-stack mt-1">{orgs.map((o) => <Link key={o.id} href={`/${o.login}`} title={o.login}><Avatar src={o.avatar_url} size={32} square alt={o.login} /></Link>)}</div></div>}
          {blog && <div className="kv"><Link2 size={16} className="icon" /><a href={blog} target="_blank" rel="noopener noreferrer nofollow" className="truncate">{profile.blog}</a></div>}
        </aside>

        <section>
          <div className="tabnav bordered">
            <Link className={`tab ${tab === "overview" ? "active" : ""}`} href={`/${owner}`}><LayoutGrid size={16} className="icon" />Ringkasan</Link>
            <Link className={`tab ${tab === "repositories" ? "active" : ""}`} href={`/${owner}?tab=repositories`}><BookMarked size={16} className="icon" />Repository <span className="counter">{profile.public_repos + (self ? profile.total_private_repos || 0 : 0)}</span></Link>
            <Link className={`tab ${tab === "stars" ? "active" : ""}`} href={`/${owner}?tab=stars`}><Star size={16} className="icon" />Bintang</Link>
          </div>

          {tab === "repositories" && (
            <form className="toolbar" action={`/${owner}`}>
              <input type="hidden" name="tab" value="repositories" />
              <SearchField className="grow" style={{ minWidth: 180 }} name="q" defaultValue={one(sp.q) || ""} placeholder="Cari repository…" label="Cari repository" />
              <select className="select auto" name="type" defaultValue={type} aria-label="Tipe">{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <select className="select auto" name="language" defaultValue={lang} aria-label="Bahasa"><option value="">Semua bahasa</option>{languages.map((l) => <option key={l}>{l}</option>)}</select>
              <select className="select auto" name="sort" defaultValue={sort} aria-label="Urutkan">{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <button className="btn"><Search size={14} className="icon" />Terapkan</button>
              {self && <Link href="/new" className="btn btn-primary"><Plus size={14} className="icon" />Baru</Link>}
            </form>
          )}

          {tab === "overview" && (
            <>
              {readme && <div className="box mb-3"><div className="box-header"><span className="box-title">{owner} / README.md</span></div><div className="box-body" style={{ padding: "24px 32px" }}><Markdown ctx={{ owner, repo: owner, ref: "HEAD", dir: "" }}>{readme}</Markdown></div></div>}
              {pinned.length > 0 && <SectionTitle icon={BookMarked}>Repository</SectionTitle>}
              <div className="pinned mb-3">{pinned.map((p) => (
                <div className="box" key={p.nameWithOwner}><div className="box-body">
                  <div className="flex items-center gap-2"><Link href={`/${p.nameWithOwner}`} className="bold wrap-any">{p.nameWithOwner.split("/")[1]}</Link><span className="pill">{p.isPrivate ? <Lock size={12} aria-hidden="true" /> : <Globe size={12} aria-hidden="true" />}{p.isPrivate ? "Private" : "Public"}</span></div>
                  <p className="muted wrap-any" style={{ margin: 0, flex: 1 }}>{p.description}</p>
                  <div className="flex gap-3 muted text-sm">{p.primaryLanguage && <span><span className="lang-dot" style={{ background: langColor(p.primaryLanguage.name) }} />{p.primaryLanguage.name}</span>}<span className="meta"><Star size={14} aria-hidden="true" />{p.stargazerCount}</span><span className="meta"><GitFork size={14} aria-hidden="true" />{p.forkCount}</span></div>
                </div></div>))}</div>
              {isUser && <Heatmap login={profile.login} year={year} base={`/${owner}`} />}
            </>
          )}
          {tab !== "overview" && (repos.length ? <RepoList repos={repos} showOwner={tab === "stars"} /> : <div className="box"><Empty icon={BookMarked} title={tab === "stars" ? "Belum ada bintang" : "Tidak ada repository"}>{tab === "repositories" && (q || lang || type !== "all") ? "Ubah filter pencarian kamu." : undefined}</Empty></div>)}
          {tab !== "overview" && <Pager base={`/${owner}`} params={params0} page={page} hasNext={hasNext} />}
        </section>
      </div>
    </div>
  );
}
