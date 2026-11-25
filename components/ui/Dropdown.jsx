"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Dropdown({ label, icon, children, align = "left", className = "btn", title, caret = true, width }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); ref.current?.querySelector("button")?.focus(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="dd" ref={ref}>
      <button type="button" className={className} title={title} aria-label={!label && title ? title : undefined} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {icon}{label}{caret && <ChevronDown size={14} className="icon" />}
      </button>
      {open && (
        <div
          className={`dd-panel ${align}`}
          style={width ? { width } : undefined}
          role="menu"
          onClick={(e) => { if (e.target.closest("a, [data-close]")) setOpen(false); }}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}
