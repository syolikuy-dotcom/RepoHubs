import Link from "next/link";
import { Gem, Search } from "lucide-react";
import { getSession } from "@/lib/session";
import { gh, safe } from "@/lib/github";
import { HeaderMenus, MainNav } from "./HeaderMenus";

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="RepoHub beranda">
      <span className="logo-mark"><Gem size={18} aria-hidden="true" /></span>
      <span>RepoHub</span>
    </Link>
  );
}

export default async function Header() {
  const session = await getSession();
  if (!session) return null;
  const unread = await safe(gh("/notifications?per_page=1"), []);
  return (
    <header className="header">
      <div className="container header-inner">
        <Logo />
        <MainNav />
        <form action="/search" className="header-search" role="search">
          <Search size={14} aria-hidden="true" />
          <input name="q" type="search" placeholder="Cari repo, kode, issue, user…" aria-label="Pencarian (tekan /)" autoComplete="off" />
          <kbd aria-hidden="true">/</kbd>
        </form>
        <div className="header-end">
          <HeaderMenus user={session.user} unread={unread.length > 0} />
        </div>
      </div>
    </header>
  );
}
