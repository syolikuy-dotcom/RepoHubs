"use client";
import { useCallback, useState } from "react";
import { useToast } from "./Toast";

/** const [run, busy] = useAction(); await run(() => api(...), "Tersimpan") */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn, okMessage) => {
    setBusy(true);
    try {
      const result = await fn();
      if (okMessage) toast(okMessage, "success");
      return { ok: true, result };
    } catch (e) {
      if (e?.name !== "AbortError") toast(e?.message || "Terjadi kesalahan.", "error");
      return { ok: false };
    } finally {
      setBusy(false);
    }
  }, [toast]);
  return [run, busy];
}
