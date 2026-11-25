import { ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import HotKeys from "@/components/HotKeys";
import CommandPalette from "@/components/CommandPalette";
import { LogoMark } from "@/components/BrandMark";

export default function AppLayout({ children }) {
  return (
    <>
      <Header />
      <HotKeys />
      <CommandPalette />
      <main>{children}</main>
      <footer className="container footer">
        <span><LogoMark />RepoHub</span>
        <span>GitHub Workspace &amp; Vercel Deploy</span>
        <span><ShieldCheck aria-hidden="true" />Token dienkripsi di cookie httpOnly</span>
      </footer>
    </>
  );
}
