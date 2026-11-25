"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookMarked, CircleDot, Code, GitPullRequest, LogOut, Moon, Plus, Rocket, Search, Settings, Star, StickyNote, Sun, UserRound } from "lucide-react";
import Dropdown from "./ui/Dropdown";
import { Avatar } from "./ui/common";
import { post } from "@/lib/client";
import { toggleTheme } from "@/lib/theme";
import { useToast } from "./ui/Toast";

const NAV = [
  { href: "/pulls", label: "Pull request", icon: GitPullRequest },
  { href: "/issues", label: "Issue", icon: CircleDot },
  { href: "/deploy", label: "Deploy", icon: Rocket },
  { href: "/gists", label: "Gist", icon: StickyNote },
];

export function MainNav() {
  const path = usePathname();
  return (
    <nav className="header-nav" aria-label="Navigasi utama">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={path.startsWith(n.href) ? "active" : ""} aria-current={path.startsWith(n.href) ? "page" : undefined}>
          <n.icon size={16} aria-hidden="true" />{n.label}
        </Link>
      ))}
    </nav>
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
      <Dropdown icon={<Avatar src={user.avatar_url} size={24} alt="" />} label="" caret={false} className="icon-btn" title="Akun" align="right" width={240}>
        {(close) => (
          <>
            <div className="dd-head">Masuk sebagai <strong style={{ color: "var(--fg)" }}>{user.login}</strong></div>
            <div className="dd-sep" />
            <Link className="dd-item" href={`/${user.login}`}><UserRound size={16} className="icon" />Profil</Link>
            <Link className="dd-item" href={`/${user.login}?tab=repositories`}><BookMarked size={16} className="icon" />Repository saya</Link>
            <Link className="dd-item" href={`/${user.login}?tab=stars`}><Star size={16} className="icon" />Bintang saya</Link>
            <div className="dd-sep" />
            <Link className="dd-item" href="/search"><Search size={16} className="icon" />Pencarian</Link>
            <Link className="dd-item" href="/pulls"><GitPullRequest size={16} className="icon" />Pull request</Link>
            <Link className="dd-item" href="/issues"><CircleDot size={16} className="icon" />Issue</Link>
            <Link className="dd-item" href="/deploy"><Rocket size={16} className="icon" />Deploy</Link>
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
