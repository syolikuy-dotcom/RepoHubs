import { Gem, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import HotKeys from "@/components/HotKeys";
import CommandPalette from "@/components/CommandPalette";

export default function AppLayout({ children }) {
  return (
    <>
      <Header />
      <HotKeys />
      <CommandPalette />
      <main>{children}</main>
      <footer className="container footer">
        <span><Gem aria-hidden="true" />RepoHub</span>
        <span>Next.js + Vercel</span>
        <span><ShieldCheck aria-hidden="true" />Token dienkripsi di cookie httpOnly</span>
      </footer>
    </>
  );
}
