"use client";
import { THEME_COOKIE } from "./constants";

/** Ganti tema terang/gelap: atribut <html data-theme> + cookie (dibaca layout server saat render awal). */
export function toggleTheme() {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  return next;
}
