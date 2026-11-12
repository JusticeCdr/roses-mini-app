"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ChevronLeft, Gift, ShoppingBag, Truck } from "lucide-react";
import { useBackButton, useShop } from "@/components/shop-provider";
import { ProductCard } from "@/components/product-card";
import { BottomBar, Button, Price, Stepper } from "@/components/ui";
import { discountPercent, money } from "@/lib/format";
import { flyToCart } from "@/lib/fly-to-cart";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { catalog, products, qtyOf, add, setQty, inTelegram } = useShop();
  const router = useRouter();
  useBackButton("/catalog");
  const p = products.get(id);
  const [qty, setLocalQty] = useState(1);
  const [slide, setSlide] = useState(0);
  const gallery = useRef<HTMLDivElement>(null);
  const inCart = qtyOf(id);

  useEffect(() => {
    const el = gallery.current;
    if (!el) return;
    const on = () => setSlide(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, [p]);

  if (!catalog) return <div className="skeleton aspect-[4/5] w-full" />;
  if (!p) {
    return (
      <div className="px-6 pt-24 text-center">
        <p className="font-display text-[26px] font-semibold">Mahsulot topilmadi</p>
        <Link href="/catalog" className="mt-4 inline-block font-semibold text-accent">Katalogga qaytish</Link>
      </div>
    );
  }

  const off = discountPercent(p.price, p.old_price);
  const related = catalog.products.filter((x) => x.category_id === p.category_id && x.id !== p.id).slice(0, 4);
  const category = catalog.categories.find((c) => c.id === p.category_id);
  const s = catalog.settings;

  return (
    <div style={{ paddingBottom: 88 }}>
      <div className="relative">
        <div ref={gallery} className="no-scrollbar flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto bg-well">
          {(p.images.length ? p.images : [""]).map((src, i) => (
            <div key={i} className="relative h-full w-full shrink-0 snap-center">
              {src ? <img src={src} alt={i === 0 ? p.name : ""} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} /> : null}
            </div>
          ))}
        </div>
        {!inTelegram ? (
          <button type="button" onClick={() => router.back()} aria-label="Orqaga" className="glass press absolute left-4 grid h-11 w-11 place-items-center rounded-full" style={{ top: "calc(var(--safe-top) + 12px)" }}>
            <ChevronLeft size={24} />
          </button>
        ) : null}
        {p.images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-11 flex justify-center gap-1.5" aria-hidden>
            {p.images.map((_, i) => <span key={i} className={clsx("h-1.5 rounded-full transition-all", i === slide ? "w-5 bg-white" : "w-1.5 bg-white/60")} />)}
          </div>
        ) : null}
        {off ? <span className="absolute top-4 right-4 rounded-full bg-accent px-3 py-1.5 text-[14px] font-bold text-accent-ink">−{off}%</span> : null}
      </div>

      <div className="enter relative -mt-7 rounded-t-[30px] bg-bg px-4 pt-6">
        {category ? <Link href={`/catalog?c=${category.id}`} className="text-[13px] font-semibold text-accent">{category.name}</Link> : null}
        <h1 className="mt-1 font-display text-[38px] leading-[1.0] font-semibold tracking-tight text-balance">{p.name}</h1>
        <div className="mt-3 flex items-center gap-3">
          <Price price={p.price} old={p.old_price} className="text-[22px]" />
          {off ? <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[13px] font-bold text-accent">−{off}%</span> : null}
        </div>
        {p.description ? <p className="mt-4 max-w-prose leading-relaxed text-ink/85 whitespace-pre-line">{p.description}</p> : null}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <div className="rounded-[20px] bg-surface p-4 shadow-soft">
            <Truck size={20} className="text-accent" aria-hidden />
            <p className="mt-2 text-[13px] font-semibold text-muted">Yetkazib berish</p>
            <p className="text-[15px] font-bold">{s.delivery_fee ? money(s.delivery_fee) : "Bepul"}</p>
          </div>
          <div className="rounded-[20px] bg-surface p-4 shadow-soft">
            <Gift size={20} className="text-accent" aria-hidden />
            <p className="mt-2 text-[13px] font-semibold text-muted">Bepul yetkazish</p>
            <p className="text-[15px] font-bold">{s.free_delivery_from ? `${money(s.free_delivery_from)} dan` : "—"}</p>
          </div>
        </div>
      </div>

      {related.length ? (
        <section aria-labelledby="rel" className="mt-10 px-4">
          <h2 id="rel" className="mb-4 font-display text-[26px] leading-none font-semibold">O‘xshash gullar</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6">
            {related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      ) : null}

      <BottomBar>
        {!p.in_stock ? (
          <Button className="w-full" disabled>Hozircha tugagan</Button>
        ) : inCart ? (
          <div className="flex items-center gap-3">
            <Stepper qty={inCart} onChange={(q) => setQty(p.id, q)} />
            <Button className="flex-1" variant="primary" onClick={() => router.push("/cart")}>
              <ShoppingBag size={18} /> Savatchaga o‘tish
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Stepper qty={qty} onChange={(q) => setLocalQty(Math.max(1, q))} />
            <Button className="flex-1" onClick={(e) => { flyToCart(e.currentTarget, p.images[0]); add(p.id, qty); }}>
              Qo‘shish · {money(p.price * qty)}
            </Button>
          </div>
        )}
      </BottomBar>
    </div>
  );
}
