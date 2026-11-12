"use client";

import { useRef, useState } from "react";
import { Check, Receipt } from "lucide-react";
import { useShop } from "./shop-provider";

/** Lets the customer send a payment receipt screenshot for an order. */
export function ReceiptButton({ orderId, sent, onSent }: { orderId: string; sent?: boolean; onSent?(url: string): void }) {
  const { t, apiForm, haptic } = useShop();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "busy" | "done">(sent ? "done" : "idle");
  const [error, setError] = useState<string | null>(null);

  async function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setState("busy");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await apiForm<{ receipt_url: string }>(`/api/orders/${orderId}/receipt`, fd);
      setState("done");
      haptic("success");
      onSent?.(r.receipt_url);
    } catch (e) {
      setState("idle");
      setError((e as Error).message);
      haptic("error");
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={() => input.current?.click()}
        className={`press inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-[15px] font-bold ${state === "done" ? "bg-accent-soft text-accent" : "bg-accent text-accent-ink"}`}
      >
        {state === "busy" ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : state === "done" ? <Check size={18} /> : <Receipt size={18} />}
        {state === "busy" ? t("receiptSending") : state === "done" ? `${t("receiptSent")} · ${t("receiptAgain")}` : t("sendReceipt")}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} />
      {error ? <p role="alert" className="mt-2 text-[14px] font-semibold text-rose">{error}</p> : state !== "done" ? <p className="mt-2 text-[13px] text-muted">{t("receiptHint")}</p> : null}
    </div>
  );
}
