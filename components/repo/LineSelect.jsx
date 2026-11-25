"use client";
import { useEffect } from "react";

/** Sorot baris dari hash #L10 atau #L10-L20; shift+klik nomor baris memperluas rentang (seperti GitHub). */
export default function LineSelect() {
  useEffect(() => {
    let last = null;
    const apply = () => {
      document.querySelectorAll("tr.hl").forEach((r) => r.classList.remove("hl"));
      const m = location.hash.match(/^#L(\d+)(?:-L(\d+))?$/);
      if (!m) return;
      const a = +m[1], b = +(m[2] || m[1]);
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) document.getElementById(`L${i}`)?.classList.add("hl");
      document.getElementById(`L${Math.min(a, b)}`)?.scrollIntoView({ block: "center" });
    };
    const onClick = (e) => {
      const a = e.target.closest("td.ln a");
      if (!a) return;
      const n = +a.textContent;
      if (e.shiftKey && last) { e.preventDefault(); history.replaceState(null, "", `#L${Math.min(last, n)}-L${Math.max(last, n)}`); apply(); }
      else last = n;
    };
    apply();
    addEventListener("hashchange", apply);
    document.addEventListener("click", onClick);
    return () => { removeEventListener("hashchange", apply); document.removeEventListener("click", onClick); };
  }, []);
  return null;
}
