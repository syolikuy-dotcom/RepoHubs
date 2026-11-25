"use client";
import { useEffect } from "react";

/** Pintasan ala GitHub: "/" fokus pencarian, Ctrl/Cmd+K palet perintah, "t" go to file (di halaman repo). */
export default function HotKeys() {
  useEffect(() => {
    const onKey = (e) => {
      const el = e.target;
      const typing = el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); window.dispatchEvent(new Event("rh:palette")); return; }
      if (typing || e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
      if (e.key === "/") { const i = document.querySelector(".header-search input"); if (i) { e.preventDefault(); i.focus(); } }
      if (e.key === "t") window.dispatchEvent(new Event("rh:filefinder"));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
