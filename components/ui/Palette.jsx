"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CornerDownLeft, LoaderCircle, Search } from "lucide-react";

/** Fuzzy subsequence: skor lebih tinggi untuk huruf berurutan & cocok di nama file (segmen terakhir). */
export function rank(items, q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return items;
  const out = [];
  for (const it of items) {
    const text = it.label.toLowerCase();
    const base = text.slice(text.lastIndexOf("/") + 1);
    let score = 0, ti = 0, streak = 0, ok = true;
    for (const ch of needle) {
      const at = text.indexOf(ch, ti);
      if (at === -1) { ok = false; break; }
      streak = at === ti ? streak + 1 : 0;
      score += 1 + streak * 2 - (at - ti) * 0.1;
      ti = at + 1;
    }
    if (!ok) continue;
    if (base.includes(needle)) score += 20;
    if (base.startsWith(needle)) score += 10;
    out.push({ it, score: score - text.length * 0.02 });
  }
  return out.sort((a, b) => b.score - a.score).map((x) => x.it);
}

export default function PaletteDialog({ open, onClose, placeholder, items, loading, onPick, extra }) {
  const ref = useRef(null);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { d.showModal(); setQ(""); setIdx(0); }
    if (!open && d.open) d.close();
  }, [open]);

  const list = useMemo(() => [...rank(items, q).slice(0, 50), ...(extra && q.trim() ? [extra(q.trim())] : [])], [items, q, extra]);
  useEffect(() => setIdx(0), [q]);
  useEffect(() => { ref.current?.querySelector(".pal-item.active")?.scrollIntoView({ block: "nearest" }); }, [idx]);

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(list.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" && list[idx]) { e.preventDefault(); onPick(list[idx]); }
  };

  return (
    <dialog ref={ref} className="palette" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} aria-label="Palet perintah">
      {open && (
        <>
          <div className="pal-head">
            <Search size={18} aria-hidden="true" />
            <input className="pal-input" autoFocus placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} role="combobox" aria-expanded="true" aria-controls="pal-list" aria-label={placeholder} spellCheck={false} />
          </div>
          <div className="pal-list" id="pal-list" role="listbox">
            {loading && <div className="center muted" style={{ padding: 16 }}><LoaderCircle size={16} className="spin" /></div>}
            {!loading && !list.length && <div className="center muted" style={{ padding: 16 }}>Tidak ada hasil.</div>}
            {list.map((it, i) => (
              <button key={it.id} role="option" aria-selected={i === idx} className={`pal-item ${i === idx ? "active" : ""}`} onMouseMove={() => setIdx(i)} onClick={() => onPick(it)}>
                {it.icon}<span className="truncate">{it.label}</span>{it.hint && <span className="hint muted text-sm">{it.hint}</span>}
              </button>
            ))}
          </div>
          <div className="pal-foot"><span><kbd aria-label="Panah atas"><ArrowUp size={11} /></kbd><kbd aria-label="Panah bawah"><ArrowDown size={11} /></kbd> pilih</span><span><kbd aria-label="Enter"><CornerDownLeft size={11} /></kbd> buka</span><span><kbd>Esc</kbd> tutup</span></div>
        </>
      )}
    </dialog>
  );
}
