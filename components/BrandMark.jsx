import Link from "next/link";
import { GitBranch } from "lucide-react";

export function LogoMark({ size = "sm" }) {
  const large = size === "lg";
  return (
    <span className={`logo-mark${large ? " lg" : ""}`} aria-hidden="true">
      <GitBranch size={large ? 26 : 17} strokeWidth={2.2} />
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="RepoHub beranda">
      <LogoMark />
      <span>RepoHub</span>
    </Link>
  );
}
