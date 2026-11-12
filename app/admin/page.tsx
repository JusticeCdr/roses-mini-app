"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  Bot, ExternalLink, Flower2, Image as ImageIcon, LayoutGrid, LogOut, Package, Settings as Cog, Tag, Ticket, Users,
} from "lucide-react";
import { Button, Field } from "@/components/ui";
import { adminApi, Resource, useRows } from "@/components/admin/resource";
import { FieldInput, type FieldDef } from "@/components/admin/fields";
import { dateTime, money } from "@/lib/format";
import { mapLinks } from "@/lib/geo";
import { ORDER_STATUS, type Banner, type Category, type Customer, type Order, type OrderStatus, type Product, type Promo, type Settings } from "@/lib/types";

type Session = { authed: boolean; configured: boolean; storage: "supabase" | "local"; bot: boolean };
type Tab = "orders" | "products" | "categories" | "banners" | "promos" | "customers" | "settings";

const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "orders", label: "Buyurtmalar", icon: Package },
  { id: "products", label: "Mahsulotlar", icon: Flower2 },
  { id: "categories", label: "Kategoriyalar", icon: LayoutGrid },
  { id: "banners", label: "Bannerlar", icon: ImageIcon },
  { id: "promos", label: "Promo-kodlar", icon: Ticket },
  { id: "customers", label: "Mijozlar", icon: Users },
  { id: "settings", label: "Sozlamalar", icon: Cog },
];

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const check = useCallback(() => {
    fetch("/api/admin/session", { cache: "no-store" }).then((r) => r.json()).then(setSession);
  }, []);
  useEffect(check, [check]);

  if (!session) return <div className="grid min-h-dvh place-items-center text-muted">Yuklanmoqda…</div>;
  if (!session.authed) return <Login session={session} onDone={check} />;
  return <Dashboard session={session} onLogout={check} />;
}

function Login({ session, onDone }: { session: Session; onDone(): void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5">
      <form
        className="enter w-full max-w-sm rounded-[28px] bg-surface p-7 shadow-[0_30px_80px_-40px_rgb(33_28_25/0.35)]"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          try {
            await adminApi("/api/admin/session", { method: "POST", body: JSON.stringify({ password: pw }) });
            onDone();
          } catch (e) {
            setErr((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="font-display text-[40px] leading-none font-bold">Roses</p>
        <p className="mt-1 mb-7 text-muted">Do‘kon boshqaruv paneli</p>
        <Field label="Parol">
          <input className="field" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" />
        </Field>
        {err ? <p role="alert" className="mt-3 font-semibold text-accent">{err}</p> : null}
        {!session.configured ? <p className="mt-3 text-[14px] text-warn">ADMIN_PASSWORD hali o‘rnatilmagan.</p> : null}
        <Button type="submit" loading={busy} className="mt-5 w-full">Kirish</Button>
      </form>
    </div>
  );
}

function Dashboard({ session, onLogout }: { session: Session; onLogout(): void }) {
  const [tab, setTab] = useState<Tab>("orders");
  const cats = useRows<Category & Record<string, unknown>>("categories");
  const prods = useRows<Product & Record<string, unknown>>("products");
  const catOptions = useMemo(() => [{ value: "", label: "— Kategoriyasiz —" }, ...(cats.rows ?? []).map((c) => ({ value: c.id, label: c.name }))], [cats.rows]);
  const catName = (id: string | null) => cats.rows?.find((c) => c.id === id)?.name ?? "Kategoriyasiz";

  useEffect(() => {
    const h = window.location.hash.slice(1) as Tab;
    if (TABS.some((t) => t.id === h)) setTab(h);
  }, []);
  const go = (t: Tab) => { setTab(t); history.replaceState(null, "", `#${t}`); window.scrollTo({ top: 0 }); };

  return (
    <div className="min-h-dvh bg-bg lg:flex">
      <aside className="glass sticky top-0 z-30 border-b border-line lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-4 pt-3 lg:px-5 lg:pt-6">
          <div>
            <p className="font-display text-[28px] leading-none font-bold">Roses</p>
            <p className="text-[13px] text-muted">Admin panel</p>
          </div>
          <div className="flex items-center gap-1 lg:hidden">
            <a href="/" target="_blank" aria-label="Do‘konni ochish" className="press grid h-11 w-11 place-items-center rounded-full"><ExternalLink size={19} /></a>
            <button type="button" aria-label="Chiqish" className="press grid h-11 w-11 place-items-center rounded-full" onClick={async () => { await adminApi("/api/admin/session", { method: "DELETE" }); onLogout(); }}><LogOut size={19} /></button>
          </div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 py-3 lg:mt-6 lg:flex-col lg:px-3">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              aria-current={tab === id ? "page" : undefined}
              className={clsx("press flex min-h-11 shrink-0 items-center gap-2.5 rounded-full px-4 text-[15px] font-semibold lg:rounded-2xl", tab === id ? "bg-ink text-white" : "text-ink hover:bg-well")}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <div className="hidden px-5 pt-4 lg:block">
          <a href="/" target="_blank" className="flex min-h-11 items-center gap-2 text-[15px] font-semibold text-muted"><ExternalLink size={17} /> Do‘konni ochish</a>
          <button type="button" className="flex min-h-11 items-center gap-2 text-[15px] font-semibold text-muted" onClick={async () => { await adminApi("/api/admin/session", { method: "DELETE" }); onLogout(); }}><LogOut size={17} /> Chiqish</button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-10 lg:py-10">
        {session.storage === "local" ? (
          <p className="mb-5 rounded-[16px] bg-[#f3e9d6] px-4 py-3 text-[14px] text-ink">
            <b>Demo rejim:</b> ma’lumotlar vaqtinchalik faylda saqlanmoqda. Doimiy saqlash uchun Supabase’ni ulang (README).
          </p>
        ) : null}

        {tab === "orders" && <Orders />}

        {tab === "products" && (
          <Resource<Product & Record<string, unknown>>
            entity="products"
            title="Mahsulotlar"
            onChange={prods.reload}
            blank={{ name: "", price: 0, old_price: null, images: [], category_id: cats.rows?.[0]?.id ?? "", description: "", in_stock: true, is_promo: false, is_new: true, sort: 0 }}
            fields={[
              { key: "images", label: "Rasmlar", type: "images", hint: "Birinchi rasm katalogda ko‘rinadi. Tik (4:5) rasmlar eng chiroyli chiqadi." },
              { key: "name", label: "Nomi (o‘zbekcha)", type: "text", required: true },
              { key: "name_ru", label: "Nomi (ruscha)", type: "text", placeholder: "Название по-русски" },
              { key: "category_id", label: "Kategoriya", type: "select", options: catOptions },
              { key: "price", label: "Narxi (so‘m)", type: "number" },
              { key: "old_price", label: "Eski narxi (so‘m)", type: "number", hint: "To‘ldirilsa, chegirma foizi avtomatik ko‘rsatiladi" },
              { key: "description", label: "Tavsif (o‘zbekcha)", type: "textarea" },
              { key: "description_ru", label: "Tavsif (ruscha)", type: "textarea" },
              { key: "is_promo", label: "Aksiyada", type: "bool", hint: "“Aksiyadagi gullar” bo‘limida chiqadi" },
              { key: "is_new", label: "Yangi", type: "bool" },
              { key: "in_stock", label: "Sotuvda bor", type: "bool" },
              { key: "sort", label: "Tartib raqami", type: "number", hint: "Kichik raqam — yuqorida" },
            ]}
            searchText={(p) => `${p.name} ${p.description} ${catName(p.category_id)}`}
            renderRow={(p, patch) => (
              <div className="flex items-center gap-3">
                <span className="block h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-well">{p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : null}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="block text-[14px] text-muted">{money(p.price)} · {catName(p.category_id)}</span>
                  <span className="mt-1 flex gap-1">
                    {p.is_promo ? <Badge tone="accent">Aksiya</Badge> : null}
                    {p.is_new ? <Badge>Yangi</Badge> : null}
                    {!p.in_stock ? <Badge tone="muted">Tugagan</Badge> : null}
                  </span>
                </span>
                <label className="ml-auto flex shrink-0 cursor-pointer flex-col items-center gap-1 text-[11px] font-semibold text-muted" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="peer sr-only" checked={p.in_stock} onChange={(e) => patch({ in_stock: e.target.checked })} aria-label="Sotuvda bor" />
                  <span aria-hidden className="relative h-7 w-12 rounded-full bg-line transition-colors peer-checked:bg-ok after:absolute after:top-0.5 after:left-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
                  Sotuvda
                </label>
              </div>
            )}
          />
        )}

        {tab === "categories" && (
          <Resource<Category & Record<string, unknown>>
            entity="categories"
            title="Kategoriyalar"
            onChange={cats.reload}
            blank={{ name: "", image: "", sort: (cats.rows?.length ?? 0) + 1, active: true }}
            fields={[
              { key: "name", label: "Nomi (o‘zbekcha)", type: "text", required: true, placeholder: "Masalan, Buketlar" },
              { key: "name_ru", label: "Nomi (ruscha)", type: "text", placeholder: "Например, Букеты" },
              { key: "image", label: "Rasm", type: "image", hint: "Kvadrat rasm — dumaloq qilib ko‘rsatiladi" },
              { key: "sort", label: "Tartib raqami", type: "number" },
              { key: "active", label: "Ko‘rinadi", type: "bool" },
            ]}
            renderRow={(c) => (
              <div className="flex items-center gap-3">
                <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-full bg-well">{c.image ? <img src={c.image} alt="" className="h-full w-full object-cover" /> : null}</span>
                <span>
                  <span className="block font-semibold">{c.name}</span>
                  <span className="block text-[14px] text-muted">{(prods.rows ?? []).filter((p) => p.category_id === c.id).length} ta mahsulot{!c.active ? " · yashirin" : ""}</span>
                </span>
              </div>
            )}
          />
        )}

        {tab === "banners" && (
          <Resource<Banner & Record<string, unknown>>
            entity="banners"
            title="Bannerlar"
            blank={{ title: "", subtitle: "", image: "", button_text: "Ko‘rish", link_type: "category", link_value: "", active: true, sort: 1 }}
            fields={[
              { key: "image", label: "Rasm", type: "image", hint: "Gorizontal rasm (16:10) — bosh sahifaning yuqorisida" },
              { key: "title", label: "Sarlavha (o‘zbekcha)", type: "text", placeholder: "Masalan, 8-mart uchun buketlar" },
              { key: "title_ru", label: "Sarlavha (ruscha)", type: "text" },
              { key: "subtitle", label: "Qisqa matn (o‘zbekcha)", type: "text" },
              { key: "subtitle_ru", label: "Qisqa matn (ruscha)", type: "text" },
              { key: "button_text", label: "Tugma matni (o‘zbekcha)", type: "text" },
              { key: "button_text_ru", label: "Tugma matni (ruscha)", type: "text" },
              { key: "link_type", label: "Bosilganda", type: "select", options: [
                { value: "none", label: "Hech qayerga" }, { value: "category", label: "Kategoriyani ochish" },
                { value: "product", label: "Mahsulotni ochish" },
              ] },
              { key: "link_value", label: "Qaysi biri", type: "select", options: [
                { value: "", label: "— tanlang —" },
                ...(cats.rows ?? []).map((c) => ({ value: c.id, label: `Kategoriya: ${c.name}` })),
                ...(prods.rows ?? []).map((p) => ({ value: p.id, label: `Mahsulot: ${p.name}` })),
              ] },
              { key: "sort", label: "Tartib raqami", type: "number" },
              { key: "active", label: "Ko‘rinadi", type: "bool" },
            ]}
            renderRow={(b) => (
              <div className="flex items-center gap-3">
                <span className="block h-14 w-24 shrink-0 overflow-hidden rounded-xl bg-well">{b.image ? <img src={b.image} alt="" className="h-full w-full object-cover" /> : null}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{b.title || "Sarlavhasiz"}</span>
                  <span className="block truncate text-[14px] text-muted">{b.subtitle}{!b.active ? " · yashirin" : ""}</span>
                </span>
              </div>
            )}
          />
        )}

        {tab === "promos" && (
          <Resource<Promo & Record<string, unknown>>
            entity="promos"
            title="Promo-kodlar"
            blank={{ code: "", title: "", type: "percent", value: 10, min_total: 0, max_uses: null, expires_at: null, active: true, show_on_home: false }}
            fields={[
              { key: "code", label: "Kod", type: "text", required: true, placeholder: "BAHOR15", hint: "Lotin harflari va raqamlar" },
              { key: "title", label: "Tavsif (o‘zbekcha, mijozga ko‘rinadi)", type: "text", placeholder: "Bahor chegirmasi 15%" },
              { key: "title_ru", label: "Tavsif (ruscha)", type: "text", placeholder: "Весенняя скидка 15%" },
              { key: "type", label: "Chegirma turi", type: "select", options: [{ value: "percent", label: "Foiz (%)" }, { value: "fixed", label: "Summa (so‘m)" }] },
              { key: "value", label: "Qiymati", type: "number" },
              { key: "min_total", label: "Eng kam buyurtma (so‘m)", type: "number" },
              { key: "max_uses", label: "Necha marta ishlatish mumkin", type: "number", hint: "Bo‘sh — cheksiz" },
              { key: "expires_at", label: "Amal qilish muddati", type: "date" },
              { key: "show_on_home", label: "Bosh sahifada ko‘rsatish", type: "bool" },
              { key: "active", label: "Faol", type: "bool" },
            ]}
            renderRow={(p) => (
              <div>
                <span className="flex items-center gap-2">
                  <Tag size={16} className="text-accent" />
                  <b className="tracking-wide">{p.code}</b>
                  <span className="text-muted">{p.type === "percent" ? `−${p.value}%` : `−${money(p.value)}`}</span>
                </span>
                <span className="mt-0.5 block text-[14px] text-muted">
                  {p.uses} marta ishlatildi{p.max_uses ? ` / ${p.max_uses}` : ""}{p.expires_at ? ` · ${p.expires_at.slice(0, 10)} gacha` : ""}{!p.active ? " · o‘chiq" : ""}{p.show_on_home ? " · bosh sahifada" : ""}
                </span>
              </div>
            )}
          />
        )}

        {tab === "customers" && <Customers />}
        {tab === "settings" && <SettingsView session={session} onSeed={() => { cats.reload(); prods.reload(); }} />}
      </main>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "accent" | "muted" }) {
  return (
    <span className={clsx("rounded-full px-2 py-0.5 text-[12px] font-bold", tone === "accent" ? "bg-accent-soft text-accent" : tone === "muted" ? "bg-well text-muted" : "bg-accent-soft text-accent")}>
      {children}
    </span>
  );
}

const STATUS_TONE: Record<OrderStatus, string> = {
  new: "bg-accent text-white",
  accepted: "bg-accent-soft text-accent",
  delivering: "bg-[#f3e9d6] text-warn",
  done: "bg-well text-ink",
  cancelled: "bg-well text-muted",
};

function Orders() {
  const { rows, setRows, reload } = useRows<Order & Record<string, unknown>>("orders");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(reload, 20000);
    return () => clearInterval(t);
  }, [reload]);

  const list = (rows ?? []).filter((o) => filter === "all" || o.status === filter);
  const today = (rows ?? []).filter((o) => o.created_at && new Date(o.created_at).toDateString() === new Date().toDateString() && o.status !== "cancelled");

  async function setStatus(o: Order, status: OrderStatus) {
    setRows((r) => r?.map((x) => (x.id === o.id ? { ...x, status } : x)) ?? null);
    try {
      await adminApi(`/api/admin/orders/${o.id}`, { method: "PUT", body: JSON.stringify({ status }) });
    } catch (e) {
      alert((e as Error).message);
      reload();
    }
  }

  return (
    <section>
      <h2 className="font-display text-[30px] leading-none font-semibold">Buyurtmalar</h2>
      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-3">
        <Stat label="Bugungi buyurtmalar" value={String(today.length)} />
        <Stat label="Yangi (javobsiz)" value={String((rows ?? []).filter((o) => o.status === "new").length)} />
        <div className="col-span-2 lg:col-span-1"><Stat label="Bugungi tushum" value={money(today.reduce((s, o) => s + o.total, 0))} /></div>
      </div>
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {(["all", ...Object.keys(ORDER_STATUS)] as (OrderStatus | "all")[]).map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={clsx("press min-h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold", filter === s ? "bg-ink text-white" : "border border-line bg-surface")}>
            {s === "all" ? "Hammasi" : ORDER_STATUS[s]}
          </button>
        ))}
      </div>
      {!rows ? (
        <div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-[18px]" />)}</div>
      ) : !list.length ? (
        <p className="mt-4 rounded-[18px] bg-surface p-6 text-center text-muted">Buyurtmalar yo‘q. Ular bu yerda va Telegram botda paydo bo‘ladi.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {list.map((o) => (
            <li key={o.id} className="rounded-[18px] bg-surface">
              <button type="button" className="press w-full p-4 text-left" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
                <div className="flex items-center gap-3">
                  <b className="text-[17px]">#{o.number}</b>
                  <span className={clsx("rounded-full px-2.5 py-0.5 text-[13px] font-bold", STATUS_TONE[o.status])}>{ORDER_STATUS[o.status]}</span>
                  <span className="ml-auto font-bold tabular-nums">{money(o.total)}</span>
                </div>
                <p className="mt-1 text-[14px] text-muted">{o.name} · {o.phone} · {dateTime(o.created_at)}</p>
              </button>
              {open === o.id ? (
                <div className="fade-in grid gap-4 border-t border-line p-4 md:grid-cols-2">
                  <div className="space-y-1.5 text-[15px]">
                    {o.items.map((i) => (
                      <div key={i.product_id} className="flex items-center gap-3">
                        <span className="block h-11 w-10 shrink-0 overflow-hidden rounded-lg bg-well">{i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" /> : null}</span>
                        <span className="flex-1">{i.name} × {i.qty}</span>
                        <span className="tabular-nums">{money(i.price * i.qty)}</span>
                      </div>
                    ))}
                    <p className="pt-2 text-muted">
                      Mahsulotlar {money(o.subtotal)}{o.discount ? ` · chegirma −${money(o.discount)} (${o.promo_code})` : ""} · yetkazish {o.delivery_fee ? money(o.delivery_fee) : "bepul"}
                    </p>
                  </div>
                  <div className="space-y-1.5 text-[15px]">
                    <p><span className="text-muted">Manzil:</span> {o.address}</p>
                    <p><span className="text-muted">Vaqt:</span> {o.delivery_time}</p>
                    <p><span className="text-muted">To‘lov:</span> {o.payment}</p>
                    {o.comment ? <p><span className="text-muted">Izoh:</span> {o.comment}</p> : null}
                    {o.card_text ? <p><span className="text-muted">Otkritka:</span> “{o.card_text}”</p> : null}
                    {o.lang === "ru" ? <p className="text-[13px] text-muted">Mijoz tili: ruscha 🇷🇺</p> : null}
                    <p className="flex flex-wrap gap-3 pt-1">
                      <a className="font-semibold text-accent" href={`tel:${o.phone.replace(/[^\d+]/g, "")}`}>Qo‘ng‘iroq qilish</a>
                      <a className="font-semibold text-accent" href={o.tg_username ? `https://t.me/${o.tg_username}` : `tg://user?id=${o.customer_id}`} target="_blank">Telegramda yozish</a>
                      {o.lat != null && o.lng != null ? <a className="font-semibold text-accent" href={mapLinks(o.lat, o.lng).yandex} target="_blank" rel="noreferrer">📍 Xaritada</a> : null}
                    </p>
                    <label className="block pt-2">
                      <span className="mb-1.5 block text-[13px] font-semibold text-muted">Holatini o‘zgartirish (mijozga xabar boradi)</span>
                      <select className="field" value={o.status} onChange={(e) => setStatus(o, e.target.value as OrderStatus)}>
                        {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-surface p-3 lg:p-4">
      <p className="text-[13px] font-semibold text-muted">{label}</p>
      <p className="mt-1 truncate text-[18px] font-bold tabular-nums lg:text-[22px]">{value}</p>
    </div>
  );
}

function Customers() {
  const { rows } = useRows<Customer & Record<string, unknown>>("customers");
  return (
    <section>
      <h2 className="font-display text-[30px] leading-none font-semibold">Mijozlar</h2>
      <p className="mt-2 mb-4 text-muted">Telegram orqali ro‘yxatdan o‘tganlar: {rows?.length ?? "…"}</p>
      <ul className="grid gap-2 lg:grid-cols-2">
        {(rows ?? []).map((c) => (
          <li key={c.id} className="rounded-[18px] bg-surface p-4">
            <p className="font-semibold">{c.name} {c.username ? <span className="font-normal text-muted">@{c.username}</span> : null}</p>
            <p className="text-[14px] text-muted">{c.phone}</p>
            {c.lat != null && c.lng != null ? <a className="text-[14px] font-semibold text-accent" href={mapLinks(c.lat, c.lng).yandex} target="_blank" rel="noreferrer">📍 Xaritada</a> : null}
            {c.address ? <p className="mt-1 text-[14px]">{c.address}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SettingsView({ session, onSeed }: { session: Session; onSeed(): void }) {
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    adminApi<{ settings: Settings }>("/api/admin/settings").then((r) => setS(r.settings));
  }, []);
  if (!s) return <div className="skeleton h-96 rounded-[18px]" />;

  const fields: FieldDef[] = [
    { key: "shop_name", label: "Do‘kon nomi", type: "text" },
    { key: "tagline", label: "Qisqa shior", type: "text" },
    { key: "phone", label: "Telefon", type: "text" },
    { key: "address", label: "Manzil", type: "text" },
    { key: "work_hours", label: "Ish vaqti", type: "text" },
    { key: "delivery_fee", label: "Yetkazib berish narxi (so‘m)", type: "number" },
    { key: "free_delivery_from", label: "Shu summadan bepul yetkazish (so‘m)", type: "number", hint: "0 — har doim pullik" },
    { key: "min_order", label: "Eng kam buyurtma (so‘m)", type: "number" },
    { key: "card_number", label: "To‘lov uchun karta raqami", type: "text", placeholder: "8600 1234 5678 9012", hint: "Mijoz “Karta orqali o‘tkazma”ni tanlasa, shu raqamni ko‘radi va nusxa oladi. Bo‘sh qolsa — faqat naqd." },
    { key: "card_holder", label: "Karta egasi", type: "text", placeholder: "ALIYEV ALI" },
    { key: "card_bank", label: "Karta turi / bank", type: "text", placeholder: "Uzcard · Kapitalbank" },
    { key: "notify_chat_ids", label: "Buyurtmalar keladigan chat ID", type: "text", hint: "Botga /id yozing — u sizning ID’ingizni aytadi. Bir nechta bo‘lsa, vergul bilan." },
    { key: "welcome_text", label: "Botdagi /start xabari", type: "textarea" },
  ];

  const run = async (key: string, fn: () => Promise<string>) => {
    setBusy(key);
    setMsg(null);
    try { setMsg(await fn()); } catch (e) { setMsg(`⚠️ ${(e as Error).message}`); } finally { setBusy(null); }
  };

  return (
    <section className="max-w-2xl">
      <h2 className="font-display text-[30px] leading-none font-semibold">Sozlamalar</h2>

      <div className="mt-5 rounded-[20px] bg-surface p-5">
        <p className="flex items-center gap-2 font-semibold"><Bot size={20} className="text-accent" /> Telegram bot</p>
        <p className="mt-1 text-[14px] text-muted">
          {session.bot ? "BOT_TOKEN o‘rnatilgan." : "BOT_TOKEN hali o‘rnatilmagan (Vercel → Environment Variables)."} Saytni Vercel’ga yuklagach “Botni ulash”ni bosing: /start, menyu tugmasi va buyurtma xabarlari sozlanadi.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button loading={busy === "setup"} disabled={!session.bot} onClick={() => run("setup", async () => {
            const r = await adminApi<{ bot: string; url: string }>("/api/admin/telegram", { method: "POST", body: JSON.stringify({ action: "setup" }) });
            return `✅ @${r.bot} ulandi → ${r.url}`;
          })}>Botni ulash</Button>
          <Button variant="ghost" loading={busy === "test"} disabled={!session.bot} onClick={() => run("test", async () => {
            const r = await adminApi<{ sent: number }>("/api/admin/telegram", { method: "POST", body: JSON.stringify({ action: "test" }) });
            return `✅ Sinov xabari ${r.sent} ta chatga yuborildi`;
          })}>Sinov xabari</Button>
        </div>
        {msg ? <p className="mt-3 text-[14px] font-semibold break-words">{msg}</p> : null}
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          run("save", async () => {
            const r = await adminApi<{ settings: Settings }>("/api/admin/settings", { method: "PUT", body: JSON.stringify(s) });
            setS(r.settings);
            return "✅ Saqlandi";
          });
        }}
      >
        {fields.map((f) => (
          <FieldRow key={f.key} def={f} value={(s as unknown as Record<string, unknown>)[f.key]} onChange={(v) => setS({ ...s, [f.key]: v } as Settings)} />
        ))}
        <Button type="submit" loading={busy === "save"} className="w-full sm:w-auto">Saqlash</Button>
      </form>

      <div className="mt-10 rounded-[20px] border border-dashed border-line p-5">
        <p className="font-semibold">Namuna ma’lumotlar</p>
        <p className="mt-1 text-[14px] text-muted">Bo‘sh do‘konga namuna kategoriya, gul, banner va ROSES10 promo-kodini qo‘shadi. Keyin o‘zingiz tahrirlaysiz.</p>
        <Button variant="ghost" className="mt-3" loading={busy === "seed"} onClick={() => run("seed", async () => {
          await adminApi("/api/admin/seed", { method: "POST" });
          onSeed();
          return "✅ Namuna ma’lumotlar qo‘shildi";
        })}>Namunalarni qo‘shish</Button>
      </div>
    </section>
  );
}

function FieldRow(props: { def: FieldDef; value: unknown; onChange(v: unknown): void }) {
  return <FieldInput {...props} />;
}
