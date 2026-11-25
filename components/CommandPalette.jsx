"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookMarked, CircleDot, Code, GitPullRequest, House, Palette, Rocket, Search, Settings } from "lucide-react";
import PaletteDialog from "./ui/Palette";
import { api } from "@/lib/client";
import { toggleTheme } from "@/lib/theme";

const ic = (I) => <I size={16} className="icon muted" />;
const COMMANDS = [
  { id: "c-home", label: "Beranda", href: "/", icon: ic(House), hint: "Navigasi" },
  { id: "c-pr", label: "Pull request saya", href: "/pulls", icon: ic(GitPullRequest), hint: "Navigasi" },
  { id: "c-issues", label: "Issue saya", href: "/issues", icon: ic(CircleDot), hint: "Navigasi" },
  { id: "c-new", label: "Repository baru", href: "/new", icon: ic(BookMarked), hint: "Buat" },
  { id: "c-gist", label: "Gist baru", href: "/gists?new=1", icon: ic(Code), hint: "Buat" },
  { id: "c-deploy", label: "Deploy / Vercel", href: "/deploy", icon: ic(Rocket), hint: "Navigasi" },
  { id: "c-notif", label: "Notifikasi", href: "/notifications", icon: ic(Bell), hint: "Navigasi" },
  { id: "c-set", label: "Pengaturan akun", href: "/settings", icon: ic(Settings), hint: "Navigasi" },
  { id: "c-theme", label: "Ganti tema terang / gelap", run: "theme", icon: ic(Palette), hint: "Tampilan" },
];

export default function CommandPalette() {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState(null);

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("rh:palette", on);
    return () => window.removeEventListener("rh:palette", on);
  }, []);
  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open || repos) return;
    api("/user/repos?sort=pushed&per_page=100&affiliation=owner,collaborator,organization_member")
      .then((r) => setRepos(r.map((x) => ({ id: `r-${x.id}`, label: x.full_name, href: `/${x.full_name}`, icon: ic(BookMarked), hint: x.private ? "Private" : "Repository" }))))
      .catch(() => setRepos([]));
  }, [open, repos]);

  const pick = useCallback((it) => {
    setOpen(false);
    if (it.run === "theme") toggleTheme();
    else router.push(it.href);
  }, [router]);

  const extra = useCallback((q) => ({ id: "x-search", label: `Cari “${q}” di GitHub`, href: `/search?q=${encodeURIComponent(q)}`, icon: ic(Search), hint: "Pencarian" }), []);
  return <PaletteDialog open={open} onClose={() => setOpen(false)} placeholder="Cari repository atau jalankan perintah…" items={[...COMMANDS, ...(repos || [])]} loading={open && !repos} onPick={pick} extra={extra} />;
}
