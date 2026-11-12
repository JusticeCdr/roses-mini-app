"use client";

/* Adapted from the 21st.dev "Product Card" compound component (deltacomponents):
   image well + overlaid badge + title/price footer, tuned for photographs and touch. */

import Link from "next/link";
import { clsx } from "clsx";
import { Minus, Plus } from "lucide-react";
import { discountPercent } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useShop } from "./shop-provider";
import { flyToCart } from "@/lib/fly-to-cart";

export function ProductCard({ p, className, eager, size = "md" }: { p: Product; className?: string; eager?: boolean; size?: "md" | "lg" }) {
  const { qtyOf, add, setQty, t, money, L } = useShop();
  const name = L(p, "name");
  const qty = qtyOf(p.id);
  const off = discountPercent(p.price, p.old_price);

  return (
    <article className={clsx("lift group relative", className)}>
      <div className="relative">
        <Link href={`/product/${p.id}`} className="photo-zoom block" aria-label={name}>
          <div className={clsx("shadow-soft relative overflow-hidden rounded-[24px] bg-cream", size === "lg" ? "aspect-[3/4]" : "aspect-[4/5]")}>
            {p.images[0] ? (
              <img
                src={p.images[0]}
                alt=""
                loading={eager ? "eager" : "lazy"}
                className={clsx("absolute inset-0 h-full w-full object-cover", !p.in_stock && "opacity-50 grayscale")}
              />
            ) : null}
            <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/18 to-transparent" aria-hidden />
          </div>
        </Link>
        <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
          {off ? <span className="rounded-full bg-rose px-2.5 py-1 text-[12px] leading-none font-bold text-accent-ink shadow-sm">−{off}%</span> : null}
          {p.is_new && !off ? <span className="glass rounded-full px-2.5 py-1 text-[12px] leading-none font-bold text-ink">{t("isNew")}</span> : null}
          {!p.in_stock ? <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[12px] leading-none font-semibold text-white">{t("soldOut")}</span> : null}
        </div>

        {p.in_stock ? (
          qty > 0 ? (
            <div className="glass-strong absolute right-2 bottom-2 left-2 flex h-11 items-center justify-between rounded-full px-1">
              <button type="button" aria-label="Kamaytirish" onClick={() => setQty(p.id, qty - 1)} className="press grid h-9 w-9 place-items-center rounded-full"><Minus size={16} /></button>
              <span className="text-[15px] font-bold tabular-nums" aria-live="polite">{t("pcs", { n: qty })}</span>
              <button type="button" aria-label="Ko‘paytirish" onClick={() => setQty(p.id, qty + 1)} className="press grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-ink"><Plus size={16} /></button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { flyToCart(e.currentTarget, p.images[0]); add(p.id); }}
              aria-label={t("addToCart", { name })}
              className="glass-strong press absolute right-2 bottom-2 grid h-11 w-11 place-items-center rounded-full text-accent"
            >
              <Plus size={20} strokeWidth={2.4} />
            </button>
          )
        ) : null}
      </div>

      <Link href={`/product/${p.id}`} className="mt-3 block px-0.5">
        <h3 className="line-clamp-1 text-[15px] leading-snug font-semibold">{name}</h3>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
          <span className={clsx("text-[15px] font-bold", off && "text-rose")}>{money(p.price)}</span>
          {off ? <s className="text-[13px] text-muted">{money(p.old_price!)}</s> : null}
        </p>
      </Link>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton aspect-[4/5] rounded-[24px]" />
      <div className="skeleton mt-3 h-4 w-3/4 rounded" />
      <div className="skeleton mt-2 h-4 w-1/2 rounded" />
    </div>
  );
}
