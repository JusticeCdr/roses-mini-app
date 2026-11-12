"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Catalog, Customer, Product } from "@/lib/types";
import { asLang, loc, moneyIn, translate, type Lang, type TKey } from "@/lib/i18n";

/* ---------- Minimal Telegram WebApp typings ---------- */
export type TgLocation = { latitude: number; longitude: number; horizontal_accuracy?: number | null };
export type TgLocationManager = {
  isInited: boolean;
  isLocationAvailable: boolean;
  isAccessRequested: boolean;
  isAccessGranted: boolean;
  init(cb?: () => void): void;
  getLocation(cb: (data: TgLocation | null) => void): void;
  openSettings(): void;
};
type TgButton = { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void };
export type TgWebApp = {
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string; language_code?: string } };
  platform: string;
  version: string;
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor?(c: string): void;
  setBackgroundColor?(c: string): void;
  setBottomBarColor?(c: string): void;
  disableVerticalSwipes?(): void;
  enableClosingConfirmation?(): void;
  isVersionAtLeast?(v: string): boolean;
  requestContact?(cb: (ok: boolean, res?: { responseUnsafe?: { contact?: { phone_number?: string } } }) => void): void;
  openTelegramLink?(url: string): void;
  showAlert?(msg: string): void;
  BackButton: TgButton;
  SettingsButton?: TgButton;
  LocationManager?: TgLocationManager;
  HapticFeedback?: {
    impactOccurred(s: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
    notificationOccurred(s: "error" | "success" | "warning"): void;
    selectionChanged(): void;
  };
  contentSafeAreaInset?: { top: number; bottom: number };
  safeAreaInset?: { top: number; bottom: number };
  onEvent?(e: string, cb: () => void): void;
};

declare global {
  interface Window { Telegram?: { WebApp?: TgWebApp } }
}

export type CartLine = { id: string; qty: number };

type Ctx = {
  tg: TgWebApp | null;
  inTelegram: boolean;
  catalog: Catalog | null;
  catalogError: string | null;
  reloadCatalog(): void;
  products: Map<string, Product>;
  me: { name: string; username?: string; photo?: string } | null;
  customer: Customer | null;
  meLoaded: boolean;
  setCustomer(c: Customer): void;
  cart: CartLine[];
  cartLoaded: boolean;
  cartCount: number;
  qtyOf(id: string): number;
  add(id: string, qty?: number): void;
  setQty(id: string, qty: number): void;
  clearCart(): void;
  promo: string;
  setPromo(code: string): void;
  api<T = unknown>(path: string, init?: RequestInit): Promise<T>;
  lang: Lang;
  setLang(l: Lang): void;
  t(key: TKey, vars?: Record<string, string | number>): string;
  money(n: number): string;
  L(row: object, field: string): string;
  haptic(kind: "tap" | "success" | "error" | "select"): void;
};

const ShopContext = createContext<Ctx | null>(null);
const CART_KEY = "roses_cart_v1";
const PROMO_KEY = "roses_promo_v1";
const LANG_KEY = "roses_lang";

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ }
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [tg, setTg] = useState<TgWebApp | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [me, setMe] = useState<Ctx["me"]>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [promo, setPromoState] = useState("");
  const initData = useRef("");
  const [lang, setLangState] = useState<Lang>("uz");
  const langRef = useRef<Lang>("uz");

  const api = useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await fetch(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-telegram-init-data": initData.current,
        "x-lang": langRef.current,
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? translate(langRef.current, "e_generic"));
    return data as T;
  }, []);

  const loadCatalog = useCallback(() => {
    setCatalogError(null);
    api<Catalog>("/api/catalog").then(setCatalog).catch((e) => setCatalogError(e.message));
  }, [api]);

  useEffect(() => {
    const w = window.Telegram?.WebApp;
    const inside = Boolean(w && w.initData);
    const saved = readLS<string>(LANG_KEY, "");
    const initial = saved ? asLang(saved) : w?.initDataUnsafe?.user?.language_code === "ru" ? "ru" : "uz";
    langRef.current = initial;
    setLangState(initial);
    document.documentElement.lang = initial;
    if (w && inside) {
      initData.current = w.initData;
      w.ready();
      w.expand();
      w.setHeaderColor?.("#f6f3ec");
      w.setBackgroundColor?.("#f6f3ec");
      w.setBottomBarColor?.("#ffffff");
      w.disableVerticalSwipes?.();
      const applyInsets = () => {
        const top = (w.safeAreaInset?.top ?? 0) + (w.contentSafeAreaInset?.top ?? 0);
        const bottom = (w.safeAreaInset?.bottom ?? 0) + (w.contentSafeAreaInset?.bottom ?? 0);
        document.documentElement.style.setProperty("--tg-safe-top", `${top}px`);
        document.documentElement.style.setProperty("--tg-safe-bottom", `${bottom}px`);
      };
      applyInsets();
      w.onEvent?.("safeAreaChanged", applyInsets);
      w.onEvent?.("contentSafeAreaChanged", applyInsets);
      setTg(w);
    }
    setCart(readLS<CartLine[]>(CART_KEY, []));
    setCartLoaded(true);
    setPromoState(readLS<string>(PROMO_KEY, ""));
    loadCatalog();
    api<{ user: { first_name: string; last_name?: string; username?: string; photo_url?: string } | null; customer: Customer | null }>("/api/me")
      .then((r) => {
        if (r.user) setMe({ name: [r.user.first_name, r.user.last_name].filter(Boolean).join(" "), username: r.user.username, photo: r.user.photo_url });
        setCustomer(r.customer);
      })
      .catch(() => {})
      .finally(() => setMeLoaded(true));
  }, [api, loadCatalog]);

  const products = useMemo(() => new Map((catalog?.products ?? []).map((p) => [p.id, p])), [catalog]);

  // Drop lines whose product was removed by the admin.
  useEffect(() => {
    if (!catalog) return;
    setCart((c) => {
      const next = c.filter((l) => products.has(l.id));
      if (next.length !== c.length) writeLS(CART_KEY, next);
      return next;
    });
  }, [catalog, products]);

  const haptic = useCallback((kind: "tap" | "success" | "error" | "select") => {
    const h = tg?.HapticFeedback;
    if (!h) return;
    if (kind === "tap") h.impactOccurred("light");
    else if (kind === "select") h.selectionChanged();
    else h.notificationOccurred(kind);
  }, [tg]);

  const update = useCallback((fn: (c: CartLine[]) => CartLine[]) => {
    setCart((c) => {
      const next = fn(c).filter((l) => l.qty > 0);
      writeLS(CART_KEY, next);
      return next;
    });
  }, []);

  const value: Ctx = {
    tg,
    inTelegram: Boolean(tg),
    catalog,
    catalogError,
    reloadCatalog: loadCatalog,
    products,
    me,
    customer,
    meLoaded,
    setCustomer,
    cart,
    cartLoaded,
    cartCount: cart.reduce((s, l) => s + l.qty, 0),
    qtyOf: (id) => cart.find((l) => l.id === id)?.qty ?? 0,
    add: (id, qty = 1) => {
      haptic("tap");
      update((c) => (c.some((l) => l.id === id) ? c.map((l) => (l.id === id ? { ...l, qty: Math.min(99, l.qty + qty) } : l)) : [...c, { id, qty }]));
    },
    setQty: (id, qty) => {
      haptic("select");
      update((c) => c.map((l) => (l.id === id ? { ...l, qty: Math.max(0, Math.min(99, qty)) } : l)));
    },
    clearCart: () => update(() => []),
    promo,
    setPromo: (code) => {
      setPromoState(code);
      writeLS(PROMO_KEY, code);
    },
    api,
    haptic,
    lang,
    setLang: (l) => {
      langRef.current = l;
      setLangState(l);
      writeLS(LANG_KEY, l);
      document.documentElement.lang = l;
      haptic("select");
    },
    t: (key, vars) => translate(lang, key, vars),
    money: (n) => moneyIn(lang, n),
    L: (row, field) => loc(lang, row as Record<string, unknown>, field),
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): Ctx {
  const c = useContext(ShopContext);
  if (!c) throw new Error("useShop outside ShopProvider");
  return c;
}

/** Shows Telegram's native back button on inner pages. */
export function useBackButton(fallback = "/") {
  const { tg } = useShop();
  const router = useRouter();
  useEffect(() => {
    if (!tg) return;
    const go = () => (window.history.length > 1 ? router.back() : router.push(fallback));
    tg.BackButton.onClick(go);
    tg.BackButton.show();
    return () => {
      tg.BackButton.offClick(go);
      tg.BackButton.hide();
    };
  }, [tg, router, fallback]);
}
