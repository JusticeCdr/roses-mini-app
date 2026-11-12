"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { Search, X } from "lucide-react";
import { useShop } from "@/components/shop-provider";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { PageHeader } from "@/components/ui";

type Sort = "default" | "cheap" | "expensive";

function Catalog() {
  const params = useSearchParams();
  const { catalog, t, L, lang } = useShop();
  const [cat, setCat] = useState(params.get("c") ?? (params.get("promo") ? "promo" : "all"));
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("default");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get("search")) input.current?.focus();
  }, [params]);

  const list = useMemo(() => {
    let l = catalog?.products ?? [];
    if (cat === "promo") l = l.filter((p) => p.is_promo || (p.old_price ?? 0) > p.price);
    else if (cat !== "all") l = l.filter((p) => p.category_id === cat);
    const term = q.trim().toLowerCase();
    if (term) l = l.filter((p) => `${p.name} ${p.description} ${p.name_ru ?? ""} ${p.description_ru ?? ""}`.toLowerCase().includes(term));
    if (sort === "cheap") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "expensive") l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [catalog, cat, q, sort, lang]);

  const chips = [
    { id: "all", name: t("all") },
    { id: "promo", name: t("promo") },
    ...(catalog?.categories ?? []).map((c) => ({ id: c.id, name: L(c, "name") })),
  ];

  return (
    <div>
      <PageHeader title={t("catalog")} />
      <div className="sticky z-20 bg-bg/90 pb-3 backdrop-blur-xl" style={{ top: "calc(var(--safe-top) + 64px)" }}>
        <div className="px-4">
          <label className="relative block">
            <span className="sr-only">{t("searchPh")}</span>
            <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              ref={input}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPh")}
              className="field !min-h-12 !rounded-full !py-3 pr-11 pl-11"
            />
            {q ? (
              <button type="button" onClick={() => setQ("")} aria-label={t("clear")} className="absolute top-1/2 right-1 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-muted">
                <X size={18} />
              </button>
            ) : null}
          </label>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              aria-pressed={cat === c.id}
              className={clsx(
                "press min-h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold",
                cat === c.id ? "bg-ink text-white" : "bg-surface text-ink shadow-soft",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-1 pb-4">
        <p className="text-[13px] font-semibold text-muted">{catalog ? t("count", { n: list.length }) : " "}</p>
        <label className="text-[13px] font-semibold text-muted">
          <span className="sr-only">Saralash</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-h-10 rounded-full border border-line bg-surface px-3 text-[14px] text-ink">
            <option value="default">{t("sortRec")}</option>
            <option value="cheap">{t("sortCheap")}</option>
            <option value="expensive">{t("sortExp")}</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 px-4">
        {catalog ? list.map((p, i) => <ProductCard key={p.id} p={p} eager={i < 4} />) : Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
      {catalog && !list.length ? <p className="px-6 py-16 text-center text-muted">{t("nothing")}</p> : null}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense>
      <Catalog />
    </Suspense>
  );
}
