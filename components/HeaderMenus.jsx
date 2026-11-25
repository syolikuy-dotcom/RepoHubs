"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookMarked, ChevronDown, CircleDot, Code, Command, GitPullRequest, House, LogOut, Menu, Moon, Plus, Rocket, Search, Settings, Star, StickyNote, Sun, UserRound, X } from "lucide-react";
import Dropdown from "./ui/Dropdown";
import { Avatar } from "./ui/common";
import { post } from "@/lib/client";
import { toggleTheme } from "@/lib/theme";
import { useToast } from "./ui/Toast";
import { LogoMark } from "./BrandMark";

const NAV = [
  { href: "/", label: "Beranda", icon: House, exact: true },
  { href: "/pulls", label: "Pull request", icon: GitPullRequest },
  { href: "/issues", label: "Issue", icon: CircleDot },
  { href: "/deploy", label: "Deploy", icon: Rocket },
  { href: "/gists", label: "Gist", icon: StickyNote },
];

export function MainNav() {
  const path = usePathname();
  return (
    <nav className="header-nav" aria-label="Navigasi utama">
      {NAV.map((n) => {
        const active = n.exact ? path === n.href : path.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <n.icon size={15} aria-hidden="true" />{n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function CommandPaletteButton() {
  return (
    <button
      type="button"
      className="icon-btn"
      title="Palet perintah (Ctrl+K)"
      aria-label="Buka palet perintah"
      onClick={() => window.dispatchEvent(new Event("rh:palette"))}
    >
      <Command size={15} />
    </button>
  );
}

export function ThemeToggleButton({ className = "icon-btn" }) {
  return (
    <button
      type="button"
      className={className}
      title="Ganti tema terang / gelap"
      aria-label="Ganti tema terang atau gelap"
      onClick={() => toggleTheme()}
    >
      <Sun size={16} className="theme-sun" aria-hidden="true" />
      <Moon size={16} className="theme-moon" aria-hidden="true" />
    </button>
  );
}

export function MobileDrawer({ user }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="icon-btn mobile-menu-btn"
        aria-label="Buka menu navigasi"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={16} />
      </button>
      {open && (
        <div className="drawer-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="drawer-panel" role="dialog" aria-label="Menu navigasi">
            <div className="flex items-center between mb-2">
              <div className="flex items-center gap-2">
                <LogoMark />
                <span className="bold">RepoHub</span>
              </div>
              <button type="button" className="icon-btn" aria-label="Tutup menu" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form action="/search" className="mb-2" role="search">
              <div className="input-icon">
                <Search size={15} aria-hidden="true" />
                <input name="q" type="search" className="input sm" placeholder="Cari di GitHub…" aria-label="Cari di GitHub" autoComplete="off" />
              </div>
            </form>
            <div className="side-nav">
              {NAV.map((n) => {
                const active = n.exact ? path === n.href : path.startsWith(n.href);
                return (
                  <Link key={n.href} href={n.href} className={active ? "active" : ""}>
                    <n.icon size={16} aria-hidden="true" />{n.label}
                  </Link>
                );
              })}
              <div className="dd-sep" />
              <Link href="/search"><Search size={16} aria-hidden="true" />Pencarian</Link>
              <Link href={`/${user.login}`}><UserRound size={16} aria-hidden="true" />Profil (@{user.login})</Link>
              <Link href={`/${user.login}?tab=repositories`}><BookMarked size={16} aria-hidden="true" />Repository saya</Link>
              <Link href="/new"><Plus size={16} aria-hidden="true" />Repository baru</Link>
              <Link href="/settings"><Settings size={16} aria-hidden="true" />Pengaturan</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function HeaderMenus({ user, unread }) {
  const router = useRouter();
  const toast = useToast();

  const logout = async () => {
    try { await post("/api/auth/logout"); } catch {}
    toast("Berhasil keluar.", "success");
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <Dropdown icon={<Plus size={16} className="icon" />} label="" className="icon-btn" title="Buat baru" align="right" width={220} caret={false}>
        <Link className="dd-item" href="/new"><BookMarked size={16} className="icon" />Repository baru</Link>
        <Link className="dd-item" href="/gists?new=1"><Code size={16} className="icon" />Gist baru</Link>
        <Link className="dd-item" href="/deploy"><Rocket size={16} className="icon" />Deploy ke Vercel</Link>
      </Dropdown>
      <Link href="/notifications" className="icon-btn" title="Notifikasi" aria-label={unread ? "Notifikasi (ada yang belum dibaca)" : "Notifikasi"}>
        <Bell size={16} />{unread && <span className="dot" />}
      </Link>
      <ThemeToggleButton />
      <Dropdown
        icon={<span className="flex items-center gap-1"><Avatar src={user.avatar_url} size={22} alt="" /><ChevronDown size={13} className="icon muted" /></span>}
        label=""
        caret={false}
        className="icon-btn avatar-btn"
        title="Menu akun"
        align="right"
        width={240}
      >
        {(close) => (
          <>
            <div className="dd-head">
              <div className="muted text-sm">Masuk sebagai</div>
              <strong style={{ color: "var(--fg)" }}>@{user.login}</strong>
            </div>
            <div className="dd-sep" />
            <Link className="dd-item" href={`/${user.login}`}><UserRound size={16} className="icon" />Profil saya</Link>
            <Link className="dd-item" href={`/${user.login}?tab=repositories`}><BookMarked size={16} className="icon" />Repository saya</Link>
            <Link className="dd-item" href={`/${user.login}?tab=stars`}><Star size={16} className="icon" />Bintang saya</Link>
            <div className="dd-sep" />
            <Link className="dd-item" href="/search"><Search size={16} className="icon" />Pencarian</Link>
            <Link className="dd-item" href="/pulls"><GitPullRequest size={16} className="icon" />Pull request</Link>
            <Link className="dd-item" href="/issues"><CircleDot size={16} className="icon" />Issue</Link>
            <Link className="dd-item" href="/deploy"><Rocket size={16} className="icon" />Deploy Vercel</Link>
            <div className="dd-sep" />
            <Link className="dd-item" href="/settings"><Settings size={16} className="icon" />Pengaturan</Link>
            <button className="dd-item" onClick={() => { toggleTheme(); close(); }}>
              <Sun size={16} className="icon theme-sun" /><Moon size={16} className="icon theme-moon" /><span>Ganti tema terang / gelap</span>
            </button>
            <div className="dd-sep" />
            <button className="dd-item danger" onClick={logout}><LogOut size={16} className="icon" />Keluar</button>
          </>
        )}
      </Dropdown>
    </>
  );
}
