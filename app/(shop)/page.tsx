"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ArrowRight, Check, ChevronRight, Clock, Copy, MapPin, RefreshCw, Search, Sparkles, Truck } from "lucide-react";
import { useShop } from "@/components/shop-provider";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Button } from "@/components/ui";
import { RoseMark } from "@/components/logo";
import { money } from "@/lib/format";
import type { Banner, Category, Product, PublicPromo } from "@/lib/types";

export default function HomePage() {
  const { catalog, catalogError, reloadCatalog, me, customer } = useShop();
  const [cat, setCat] = useState<string>("all");

  if (catalogError) {
    return (
      <div className="px-6 pt-24 text-center">
        <p className="font-display text-[26px] font-semibold">Ulanib bo‘lmadi</p>
        <p className="mt-2 text-muted">{catalogError}</p>
        <Button variant="ghost" className="mt-6" onClick={reloadCatalog}><RefreshCw size={18} /> Qayta urinish</Button>
      </div>
    );
  }

  const s = catalog?.settings;
  const products = catalog?.products ?? [];
  const promoProducts = products.filter((p) => p.in_stock && (p.is_promo || (p.old_price ?? 0) > p.price));
  const featured = products.find((p) => p.is_new && p.in_stock) ?? products[0];
  const list = products.filter((p) => cat === "all" || p.category_id === cat);
  const firstName = (customer?.name || me?.name || "").split(" ")[0];

  return (
    <div>
      {/* Header */}
      <header className="px-4" style={{ paddingTop: "calc(var(--safe-top) + 14px)" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <RoseMark size={40} />
            <div className="leading-none">
              <p className="font-display text-[28px] font-bold tracking-tight">{s?.shop_name ?? "Roses"}</p>
              <p className="mt-0.5 text-[12px] font-semibold tracking-wide text-muted">{s?.tagline ?? "Gul do‘koni"}</p>
            </div>
          </div>
          {firstName ? (
            <Link href="/profile" className="press grid h-11 w-11 place-items-center rounded-full bg-surface font-display text-[20px] font-bold text-accent shadow-soft" aria-label="Profil">
              {firstName.charAt(0)}
            </Link>
          ) : null}
        </div>

        <h1 className="mt-6 font-display text-[34px] leading-[1.02] font-semibold tracking-tight text-balance">
          {firstName ? <>{firstName}, bugun kimni <em className="text-accent not-italic">xursand</em> qilamiz?</> : <>Bugun kimni <em className="text-accent not-italic">xursand</em> qilamiz?</>}
        </h1>

        <Link href="/catalog?search=1" className="press shadow-soft mt-4 flex h-12 items-center gap-3 rounded-full bg-surface px-4 text-[15px] text-muted">
          <Search size={19} className="text-ink" aria-hidden />
          Buket, atirgul yoki sovg‘a qidiring
        </Link>
      </header>

      {/* Banners */}
      <section aria-label="Aksiyalar va yangiliklar" className="mt-6">
        {catalog ? <Banners banners={catalog.banners} /> : <div className="skeleton mx-4 aspect-[5/4] rounded-[28px]" />}
      </section>

      {/* Service facts from settings */}
      {s ? (
        <ul className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4" aria-label="Xizmat">
          {s.free_delivery_from ? <Fact icon={<Truck size={16} />}>{money(s.free_delivery_from)} dan bepul yetkazish</Fact> : s.delivery_fee ? <Fact icon={<Truck size={16} />}>Yetkazish {money(s.delivery_fee)}</Fact> : null}
          {s.work_hours ? <Fact icon={<Clock size={16} />}>{s.work_hours}</Fact> : null}
          {s.address ? <Fact icon={<MapPin size={16} />}>{s.address}</Fact> : null}
        </ul>
      ) : null}

      {/* Promo codes */}
      {catalog?.promos.length ? (
        <section aria-label="Promo-kodlar" className="mt-6 space-y-2 px-4">
          {catalog.promos.map((p) => <PromoTicket key={p.code} p={p} />)}
        </section>
      ) : null}

      {/* Categories bento */}
      <section aria-labelledby="cat-title" className="mt-10 px-4">
        <SectionHead id="cat-title" title="Kategoriyalar" href="/catalog" />
        {catalog ? <CategoryBento categories={catalog.categories} products={products} /> : <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-square rounded-[24px]" />)}</div>}
      </section>

      {/* Promo products */}
      {promoProducts.length ? (
        <section aria-labelledby="promo-title" className="mt-11">
          <div className="px-4"><SectionHead id="promo-title" title="Aksiyadagi gullar" href="/catalog?promo=1" kicker="Chegirmalar" /></div>
          <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3">
            {promoProducts.map((p) => <ProductCard key={p.id} p={p} size="lg" className="w-[58%] shrink-0 snap-start" />)}
          </div>
        </section>
      ) : null}

      {/* Featured */}
      {featured ? <Featured p={featured} /> : null}

      {/* All products */}
      <section aria-labelledby="all-title" className="mt-11">
        <div className="px-4"><SectionHead id="all-title" title="Barcha gullar" href={cat === "all" ? "/catalog" : `/catalog?c=${cat}`} /></div>
        <div className="no-scrollbar -mt-1 mb-5 flex gap-2 overflow-x-auto px-4">
          {[{ id: "all", name: "Hammasi" }, ...(catalog?.categories ?? [])].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              aria-pressed={cat === c.id}
              className={clsx("press min-h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold", cat === c.id ? "bg-ink text-white" : "bg-surface text-ink shadow-soft")}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 px-4">
          {catalog ? list.map((p, i) => <ProductCard key={p.id} p={p} eager={i < 2} />) : Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
        {catalog && !list.length ? <p className="py-10 text-center text-muted">Bu bo‘limda hozircha gul yo‘q.</p> : null}
      </section>

      {/* Footer */}
      {s ? (
        <footer className="mx-4 mt-14 rounded-[28px] bg-blush p-6">
          <div className="flex items-center gap-2.5">
            <RoseMark size={32} />
            <p className="font-display text-[26px] font-bold">{s.shop_name}</p>
          </div>
          {s.tagline ? <p className="mt-2 max-w-xs text-[15px] text-ink/80">{s.tagline}</p> : null}
          <div className="mt-4 space-y-1 text-[14px] text-muted">
            {s.address ? <p>{s.address}</p> : null}
            {s.work_hours ? <p>{s.work_hours}</p> : null}
            {s.phone ? <a className="font-semibold text-accent" href={`tel:${s.phone.replace(/[^\d+]/g, "")}`}>{s.phone}</a> : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function Fact({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex shrink-0 items-center gap-2 rounded-full bg-surface/80 px-3.5 py-2 text-[13px] font-semibold text-ink shadow-soft">
      <span className="text-accent" aria-hidden>{icon}</span>
      {children}
    </li>
  );
}

function SectionHead({ id, title, href, kicker }: { id: string; title: string; href: string; kicker?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {kicker ? <p className="mb-1 flex items-center gap-1 text-[13px] font-semibold text-accent"><Sparkles size={14} /> {kicker}</p> : null}
        <h2 id={id} className="font-display text-[30px] leading-none font-semibold tracking-tight">{title}</h2>
      </div>
      <Link href={href} className="press -mr-1 inline-flex min-h-11 items-center gap-0.5 px-1 text-[14px] font-semibold text-muted">
        Hammasi <ChevronRight size={17} />
      </Link>
    </div>
  );
}

function CategoryBento({ categories, products }: { categories: Category[]; products: Product[] }) {
  const count = (id: string) => products.filter((p) => p.category_id === id).length;
  const tile = (c: Category, cls: string, big?: boolean) => (
    <Link key={c.id} href={`/catalog?c=${c.id}`} className={clsx("photo-zoom press shadow-soft relative block overflow-hidden rounded-[24px] bg-cream", cls)}>
      {c.image ? <img src={c.image.replace(/w=\d+&h=\d+/, "w=600&h=600")} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /> : null}
      <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" aria-hidden />
      <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
        <span className={clsx("block font-display leading-[1.05] font-semibold", big ? "text-[26px]" : "text-[21px]")}>{c.name}</span>
        <span className="mt-0.5 block text-[12px] font-semibold text-white/85">{count(c.id)} ta tur</span>
      </span>
    </Link>
  );
  const [a, b, ...rest] = categories;
  return (
    <div className="grid grid-cols-2 gap-3">
      {a ? tile(a, "row-span-2 aspect-[1/1.32]", true) : null}
      {b ? tile(b, "aspect-[1/0.64]") : null}
      {rest[0] ? tile(rest[0], "aspect-[1/0.64]") : null}
      {rest.slice(1).map((c, i, arr) => (arr.length % 2 === 1 && i === arr.length - 1 ? tile(c, "col-span-2 aspect-[2/0.64]", true) : tile(c, "aspect-[1/0.64]")))}
    </div>
  );
}

function Featured({ p }: { p: Product }) {
  const { add, qtyOf } = useShop();
  const router = useRouter();
  const inCart = qtyOf(p.id) > 0;
  return (
    <section aria-labelledby="feat" className="mx-4 mt-11 overflow-hidden rounded-[28px] bg-surface shadow-soft">
      <Link href={`/product/${p.id}`} className="photo-zoom relative block aspect-[16/11] overflow-hidden bg-cream">
        {p.images[0] ? <img src={p.images[0].replace(/w=\d+&h=\d+/, "w=1000&h=690")} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /> : null}
        <span className="glass absolute top-3 left-3 rounded-full px-3 py-1.5 text-[12px] font-bold">Yangi kelgan</span>
      </Link>
      <div className="p-5">
        <h2 id="feat" className="font-display text-[30px] leading-none font-semibold">{p.name}</h2>
        {p.description ? <p className="mt-2 line-clamp-2 text-[15px] text-ink/75">{p.description}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[18px] font-bold">{money(p.price)}</span>
          <Button className="!min-h-12 !rounded-full !px-5 !text-[15px]" onClick={() => (inCart ? router.push("/cart") : add(p.id))}>
            {inCart ? <>Savatchada <ArrowRight size={17} /></> : "Savatchaga"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Banners({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? el.clientWidth;
      setIdx(Math.round(el.scrollLeft / (w + 12)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!banners.length) return null;

  const open = (b: Banner) => {
    if (b.link_type === "category" && b.link_value) router.push(`/catalog?c=${b.link_value}`);
    else if (b.link_type === "product" && b.link_value) router.push(`/product/${b.link_value}`);
    else if (b.link_type === "url" && b.link_value) window.open(b.link_value, "_blank");
  };

  return (
    <div>
      <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4">
        {banners.map((b, i) => (
          <button
            key={b.id}
            type="button"
            onClick={() => open(b)}
            className={clsx("photo-zoom press shadow-soft relative aspect-[5/4] shrink-0 snap-start overflow-hidden rounded-[28px] bg-cream text-left", banners.length > 1 ? "w-[90%]" : "w-full", i === 0 && "enter")}
          >
            <img src={b.image} alt="" loading={i === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/0" aria-hidden />
            {banners.length > 1 ? (
              <span className="glass absolute top-3 right-3 rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums">{i + 1} / {banners.length}</span>
            ) : null}
            <span className="absolute inset-x-0 bottom-0 p-5 text-white">
              <span className="block max-w-[85%] font-display text-[34px] leading-[0.98] font-semibold text-balance">{b.title}</span>
              {b.subtitle ? <span className="mt-2 block text-[15px] leading-snug text-white/90">{b.subtitle}</span> : null}
              {b.button_text && b.link_type !== "none" ? (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-ink">
                  {b.button_text} <ArrowRight size={16} />
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
      {banners.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {banners.map((b, i) => <span key={b.id} className={clsx("h-1.5 rounded-full transition-all duration-300", i === idx ? "w-6 bg-accent" : "w-1.5 bg-ink/15")} />)}
        </div>
      ) : null}
    </div>
  );
}

function PromoTicket({ p }: { p: PublicPromo }) {
  const { setPromo, haptic } = useShop();
  const [done, setDone] = useState(false);
  const apply = async () => {
    setPromo(p.code);
    haptic("success");
    try { await navigator.clipboard?.writeText(p.code); } catch { /* ignore */ }
    setDone(true);
    setTimeout(() => setDone(false), 2200);
  };
  return (
    <div className="relative flex items-stretch overflow-hidden rounded-[22px] bg-accent text-accent-ink shadow-[0_14px_30px_-16px_rgb(156_71_88/0.8)]">
      <div className="min-w-0 flex-1 p-4 pr-3">
        <p className="font-display text-[30px] leading-none font-semibold">{p.type === "percent" ? `−${p.value}%` : `−${money(p.value)}`}</p>
        {p.title ? <p className="mt-1.5 text-[14px] leading-snug font-semibold text-white/95">{p.title}</p> : null}
        {p.min_total ? <p className="mt-1 text-[12px] text-white/80">{money(p.min_total)} dan boshlab</p> : null}
      </div>
      <div className="relative flex w-[120px] shrink-0 flex-col items-center justify-center gap-2 border-l-2 border-dashed border-white/35 p-3">
        <span className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-bg" aria-hidden />
        <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-bg" aria-hidden />
        <span className="text-[15px] font-bold tracking-wider">{p.code}</span>
        <button type="button" onClick={apply} className="press inline-flex min-h-9 items-center gap-1 rounded-full bg-white px-3 text-[13px] font-bold text-accent">
          {done ? <><Check size={14} /> Olindi</> : <><Copy size={14} /> Olish</>}
        </button>
      </div>
    </div>
  );
}
