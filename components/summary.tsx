"use client";

import { useShop } from "./shop-provider";
import type { QuoteResult } from "./use-quote";

export function Summary({ q, loading }: { q: QuoteResult | null; loading?: boolean }) {
  const { t, money } = useShop();
  if (!q) return null;
  const row = (label: string, value: string, strong?: boolean) => (
    <div className={strong ? "flex justify-between pt-3 text-[18px] font-bold" : "flex justify-between text-[15px]"}>
      <span className={strong ? "" : "text-muted"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
  return (
    <div className={`space-y-2 rounded-[22px] bg-surface p-4 shadow-soft transition-opacity ${loading ? "opacity-60" : ""}`}>
      {row(t("goods"), money(q.subtotal))}
      {q.discount ? row(`${t("discount")}${q.promo ? ` · ${q.promo.code}` : ""}`, `−${money(q.discount)}`) : null}
      {row(t("delivery"), q.delivery_fee ? money(q.delivery_fee) : t("free"))}
      <div className="border-t border-line" />
      {row(t("total"), money(q.total), true)}
    </div>
  );
}
