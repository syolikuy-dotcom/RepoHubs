"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const dismiss = useCallback((id) => setList((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setList((l) => [...l.slice(-3), { id, message, type }]);
    setTimeout(() => dismiss(id), type === "error" ? 8000 : 4000);
  }, [dismiss]);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === "error" ? <CircleAlert size={16} className="icon" style={{ color: "var(--danger)", marginTop: 2 }} />
              : t.type === "success" ? <CircleCheck size={16} className="icon" style={{ color: "var(--success)", marginTop: 2 }} />
              : <Info size={16} className="icon" style={{ color: "var(--link)", marginTop: 2 }} />}
            <span className="grow">{t.message}</span>
            <button className="btn-ghost btn btn-sm" style={{ height: 20, padding: 0 }} onClick={() => dismiss(t.id)} aria-label="Tutup"><X size={14} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
