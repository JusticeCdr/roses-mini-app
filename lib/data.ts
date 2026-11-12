import { store } from "./store";
import { DEFAULT_SETTINGS } from "./seed";
import type { Banner, Catalog, Category, Order, Product, Promo, Settings } from "./types";

export async function getSettings(): Promise<Settings> {
  const row = await store().get<{ id: string; data: Partial<Settings> }>("settings", "main");
  return { ...DEFAULT_SETTINGS, ...(row?.data ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await store().upsert("settings", { id: "main", data: next });
  return next;
}

export function notifyIds(s: Settings): string[] {
  const fromEnv = process.env.OWNER_CHAT_IDS ?? "";
  return [...new Set(`${s.notify_chat_ids},${fromEnv}`.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean))];
}

const bySort: [string, "asc" | "desc"][] = [["sort", "asc"], ["created_at", "desc"]];

export async function getCatalog(): Promise<Catalog> {
  const s = store();
  const [settings, categories, products, banners, promos] = await Promise.all([
    getSettings(),
    s.list<Category>("categories", { order: bySort }),
    s.list<Product>("products", { order: bySort }),
    s.list<Banner>("banners", { order: bySort }),
    s.list<Promo>("promos", { order: [["created_at", "desc"]] }),
  ]);
  const activeCats = categories.filter((c) => c.active);
  const catIds = new Set(activeCats.map((c) => c.id));
  return {
    settings: { ...settings, notify_chat_ids: "" },
    categories: activeCats,
    products: products.filter((p) => !p.category_id || catIds.has(p.category_id)),
    banners: banners.filter((b) => b.active),
    promos: promos
      .filter((p) => p.active && p.show_on_home && promoUsable(p))
      .map(({ code, title, type, value, min_total }) => ({ code, title, type, value, min_total })),
  };
}

export function promoUsable(p: Promo): boolean {
  if (!p.active) return false;
  if (p.expires_at && new Date(p.expires_at).getTime() < Date.now()) return false;
  if (p.max_uses != null && p.max_uses > 0 && p.uses >= p.max_uses) return false;
  return true;
}

export async function findPromo(code: string): Promise<Promo | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  const list = await store().list<Promo>("promos", { where: { code: c } });
  return list[0] ?? null;
}

export type Quote = {
  items: Order["items"];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  promo: Promo | null;
  promoError: string | null;
};

/** Prices are always taken from the database, never from the client. */
export async function quote(lines: { id: string; qty: number }[], promoCode?: string | null): Promise<Quote> {
  const [products, settings] = await Promise.all([store().list<Product>("products"), getSettings()]);
  const map = new Map(products.map((p) => [p.id, p]));
  const items: Order["items"] = [];
  for (const l of lines) {
    const p = map.get(String(l.id));
    const qty = Math.max(1, Math.min(99, Math.floor(Number(l.qty) || 0)));
    if (!p || !p.in_stock) continue;
    items.push({ product_id: p.id, name: p.name, price: p.price, qty, image: p.images[0] ?? null });
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  let promo: Promo | null = null;
  let promoError: string | null = null;
  let discount = 0;
  if (promoCode) {
    const found = await findPromo(promoCode);
    if (!found || !promoUsable(found)) promoError = "Bunday promo-kod yo‘q yoki muddati tugagan";
    else if (subtotal < found.min_total) promoError = `Promo-kod ${found.min_total.toLocaleString("ru-RU")} so‘mdan boshlab ishlaydi`;
    else {
      promo = found;
      discount = found.type === "percent" ? Math.round((subtotal * found.value) / 100) : Math.min(found.value, subtotal);
    }
  }
  const afterDiscount = subtotal - discount;
  const delivery_fee =
    items.length === 0 ? 0 : settings.free_delivery_from > 0 && afterDiscount >= settings.free_delivery_from ? 0 : settings.delivery_fee;
  return { items, subtotal, discount, delivery_fee, total: afterDiscount + delivery_fee, promo, promoError };
}
