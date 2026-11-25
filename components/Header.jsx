import { Search } from "lucide-react";
import { getSession } from "@/lib/session";
import { gh, safe } from "@/lib/github";
import { Logo } from "./BrandMark";
import { CommandPaletteButton, HeaderMenus, MainNav, MobileDrawer } from "./HeaderMenus";

export { Logo };

export default async function Header() {
  const session = await getSession();
  if (!session) return null;
  const unread = await safe(gh("/notifications?per_page=1"), []);
  return (
    <header className="header">
      <div className="container header-inner">
        <MobileDrawer user={session.user} />
        <Logo />
        <MainNav />
        <div className="header-search-wrap">
          <form action="/search" className="header-search" role="search">
            <Search size={14} aria-hidden="true" />
            <input name="q" type="search" placeholder="Ketik / untuk mencari…" aria-label="Pencarian (tekan /)" autoComplete="off" />
            <kbd aria-hidden="true">/</kbd>
          </form>
          <CommandPaletteButton />
        </div>
        <div className="header-end">
          <HeaderMenus user={session.user} unread={unread.length > 0} />
        </div>
      </div>
    </header>
  );
}
