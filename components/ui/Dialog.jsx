"use client";
import { useEffect, useRef, useState } from "react";
import { Info, TriangleAlert, X } from "lucide-react";
import { useAction } from "./useAction";
import { BtnIcon } from "./common";

export function Dialog({ open, onClose, title, children, footer, icon: Icon, danger = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="modal" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} aria-label={typeof title === "string" ? title : undefined}>
      {open && (
        <>
          <div className={`modal-head${danger ? " danger" : ""}`}>
            <span>{Icon && <Icon size={16} aria-hidden="true" />}{title}</span>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Tutup"><X size={14} /></button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-foot">{footer}</div>}
        </>
      )}
    </dialog>
  );
}

/** Tombol + dialog konfirmasi. requireText = pengguna harus mengetik teks itu (untuk aksi destruktif). */
export function ConfirmButton({ label, icon, title, message, confirmLabel, requireText, danger = true, onConfirm, className = "btn btn-danger", disabled }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [run, busy] = useAction();
  const blocked = requireText ? typed !== requireText : false;

  const go = async () => {
    const r = await run(onConfirm);
    if (r.ok) { setOpen(false); setTyped(""); }
  };

  return (
    <>
      <button type="button" className={className} disabled={disabled} title={title || undefined} aria-label={!label ? title : undefined} onClick={() => setOpen(true)}>{icon}{label}</button>
      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={title || label}
        icon={danger ? TriangleAlert : Info}
        danger={danger}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)} disabled={busy}>Batal</button>
            <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} disabled={busy || blocked} onClick={go}>
              <BtnIcon busy={busy} />{confirmLabel || label}
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>{message}</p>
        {requireText && (
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="confirm-text">Ketik <code>{requireText}</code> untuk melanjutkan</label>
            <input id="confirm-text" className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
          </div>
        )}
      </Dialog>
    </>
  );
}
