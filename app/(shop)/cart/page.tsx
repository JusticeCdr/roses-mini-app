"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flower2, Trash2, Truck, X } from "lucide-react";
import { useShop } from "@/components/shop-provider";
import { BottomBar, Button, Empty, PageHeader, Price, Stepper } from "@/components/ui";
import { Summary } from "@/components/summary";
import { useQuote } from "@/components/use-quote";

export default function CartPage() {
  const { cart, cartLoaded, products, setQty, clearCart, promo, setPromo, catalog, t, money, L } = useShop();
  const { quote, loading } = useQuote();
  const router = useRouter();
  const [code, setCode] = useState("");

  if (!cartLoaded) return <PageHeader title={t("cart")} />;
  if (!cart.length) {
    return (
      <div>
        <PageHeader title={t("cart")} />
        <Empty
          icon={<Flower2 size={34} />}
          title={t("cartEmpty")}
          text={t("cartEmptyText")}
          action={<Link href="/catalog"><Button>{t("openCatalog")}</Button></Link>}
        />
      </div>
    );
  }

  const min = catalog?.settings.min_order ?? 0;
  const belowMin = quote ? min > 0 && quote.subtotal < min : false;
  const unavailable = quote ? cart.filter((l) => !quote.available.includes(l.id)) : [];

  return (
    <div style={{ paddingBottom: 88 }}>
      <PageHeader
        title={t("cart")}
        right={<button type="button" onClick={clearCart} className="press inline-flex min-h-11 items-center gap-1 px-2 text-[14px] font-semibold text-muted"><Trash2 size={16} /> {t("clear")}</button>}
      />

      {quote && catalog?.settings.free_delivery_from ? (() => {
        const goal = catalog.settings.free_delivery_from;
        const have = quote.subtotal - quote.discount;
        const left = Math.max(0, goal - have);
        return (
          <div className="mx-4 mb-4 rounded-[20px] bg-surface p-4 shadow-soft">
            <p className="flex items-center gap-2 text-[14px] font-semibold">
              <Truck size={18} className="text-accent" aria-hidden />
              {left > 0 ? t("leftForFree", { sum: money(left) }) : t("freeNow")}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream" aria-hidden>
              <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.min(100, (have / goal) * 100)}%` }} />
            </div>
          </div>
        );
      })() : null}

      <ul className="space-y-3 px-4">
        {cart.map((l) => {
          const p = products.get(l.id);
          if (!p) return null;
          const off = unavailable.some((u) => u.id === l.id);
          return (
            <li key={l.id} className="flex gap-3 rounded-[22px] bg-surface p-3 shadow-soft">
              <Link href={`/product/${p.id}`} className="block h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-well">
                {p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : null}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start gap-2">
                  <Link href={`/product/${p.id}`} className="line-clamp-2 flex-1 text-[15px] leading-snug font-semibold">{L(p, "name")}</Link>
                  <button type="button" onClick={() => setQty(l.id, 0)} aria-label="O‘chirish" className="press -mt-2 -mr-2 grid h-10 w-10 place-items-center rounded-full text-muted"><X size={18} /></button>
                </div>
                {off ? <p className="text-[13px] font-semibold text-warn">{t("unavailable")}</p> : <Price price={p.price} old={p.old_price} className="text-[14px]" />}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <Stepper qty={l.qty} size="sm" onChange={(q) => setQty(l.id, q)} />
                  <span className="text-[15px] font-bold tabular-nums">{money(p.price * l.qty)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="promo-h" className="mt-6 px-4">
        <h2 id="promo-h" className="mb-2 text-[13px] font-semibold text-muted">{t("promoCode")}</h2>
        {promo && quote?.promo ? (
          <div className="flex items-center justify-between rounded-[16px] bg-accent-soft px-4 py-3">
            <span className="text-[15px] font-semibold">{t("promoApplied", { code: quote.promo.code })}</span>
            <button type="button" onClick={() => setPromo("")} className="press min-h-10 px-2 text-[14px] font-semibold text-muted">{t("remove")}</button>
          </div>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) setPromo(code.trim().toUpperCase());
            }}
          >
            <input className="field uppercase" value={code || promo} onChange={(e) => { setCode(e.target.value); if (promo) setPromo(""); }} placeholder={t("enterCode")} autoCapitalize="characters" />
            <Button type="submit" variant="ghost" className="shrink-0">{t("apply")}</Button>
          </form>
        )}
        {promo && quote?.promoError ? <p role="alert" className="mt-2 text-[14px] font-semibold text-accent">{quote.promoError}</p> : null}
      </section>

      <div className="mt-6 px-4">
        <Summary q={quote} loading={loading} />
        {belowMin ? <p className="mt-3 text-[14px] font-semibold text-warn">{t("minOrder", { sum: money(min) })}</p> : null}
      </div>

      <BottomBar>
        <Button className="w-full" disabled={!quote || belowMin || unavailable.length === cart.length} onClick={() => router.push("/checkout")}>
          {t("checkout")}{quote ? ` · ${money(quote.total)}` : ""}
        </Button>
      </BottomBar>
    </div>
  );
}
