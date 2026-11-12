"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LiquidGlass } from "./liquid-glass";
import { clsx } from "clsx";
import { ChevronLeft, Home, LayoutGrid, Minus, Package, Plus, ShoppingBag, User } from "lucide-react";
import { money } from "@/lib/format";
import { useShop } from "./shop-provider";

const TABS = [
  { href: "/", label: "Asosiy", icon: Home },
  { href: "/catalog", label: "Katalog", icon: LayoutGrid },
  { href: "/cart", label: "Savatcha", icon: ShoppingBag },
  { href: "/orders", label: "Buyurtmalar", icon: Package },
  { href: "/profile", label: "Profil", icon: User },
];

function tabIndex(path: string): number {
  if (path === "/") return 0;
  if (path.startsWith("/catalog") || path.startsWith("/product")) return 1;
  if (path.startsWith("/cart") || path.startsWith("/checkout")) return 2;
  if (path.startsWith("/orders")) return 3;
  if (path.startsWith("/profile")) return 4;
  return 0;
}

export function TabBar() {
  const path = usePathname();
  const { cartCount, haptic } = useShop();
  const active = tabIndex(path);
  const [stretchKey, setStretchKey] = useState(0);
  const prev = useRef(active);
  useEffect(() => {
    if (prev.current !== active) {
      setStretchKey((k) => k + 1);
      prev.current = active;
    }
  }, [active]);

  return (
    <nav aria-label="Asosiy menyu" className="tabbar pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
      <LiquidGlass
        radius={28}
        bevelDepth={12}
        scale={30}
        aberration={2}
        frost={3}
        tint={0.8}
        className="glass-rim pointer-events-auto mx-auto max-w-md"
      >
        <ul className="relative grid h-16 grid-cols-5 px-1.5">
          <li aria-hidden className="pointer-events-none absolute inset-y-[5px] left-1.5" style={{ width: "calc((100% - 12px) / 5)" }}>
            <span
              className="tab-indicator absolute inset-0 block rounded-[22px]"
              style={{ transform: `translateX(${active * 100}%)` }}
            >
              <span key={stretchKey} className={clsx("block h-full w-full rounded-[22px]", stretchKey > 0 && "tab-indicator-stretch")} />
            </span>
          </li>
          {TABS.map(({ href, label, icon: Icon }, i) => {
            const on = i === active;
            const badge = href === "/cart" ? cartCount : 0;
            return (
              <li key={href} className={clsx("relative z-10 flex items-center justify-center", on && "tab-active")}>
                <Link
                  href={href}
                  onClick={() => !on && haptic("select")}
                  aria-current={on ? "page" : undefined}
                  className={clsx(
                    "flex h-[54px] w-full flex-col items-center justify-center gap-0.5 rounded-[22px] text-[11px] font-semibold transition-colors duration-300 active:scale-95",
                    on ? "text-accent" : "text-ink/60",
                  )}
                >
                  <span className="tab-icon relative" id={href === "/cart" ? "cart-tab-icon" : undefined}>
                    <Icon size={22} strokeWidth={on ? 2.2 : 1.8} aria-hidden />
                    {badge ? (
                      <span key={badge} className="pop absolute -top-1.5 -right-2.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] leading-none font-bold text-accent-ink ring-2 ring-white">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </LiquidGlass>
    </nav>
  );
}

export function PageHeader({ title, back, right }: { title: string; back?: string; right?: React.ReactNode }) {
  const { inTelegram } = useShop();
  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl" style={{ paddingTop: "var(--safe-top)" }}>
      <div className="mx-auto flex h-16 max-w-xl items-center gap-2 px-4">
        {back && !inTelegram ? (
          <Link href={back} aria-label="Orqaga" className="press -ml-2 grid h-11 w-11 place-items-center rounded-full">
            <ChevronLeft size={24} />
          </Link>
        ) : null}
        <h1 className="flex-1 truncate font-display text-[32px] leading-none font-semibold tracking-tight">{title}</h1>
        {right}
      </div>
    </header>
  );
}

export function Price({ price, old, className }: { price: number; old?: number | null; className?: string }) {
  return (
    <span className={clsx("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className="font-bold">{money(price)}</span>
      {old && old > price ? <s className="text-[13px] text-muted">{money(old)}</s> : null}
    </span>
  );
}

export function Stepper({ qty, onChange, size = "md" }: { qty: number; onChange(q: number): void; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  return (
    <div className="inline-flex items-center rounded-full bg-well">
      <button type="button" aria-label="Kamaytirish" onClick={() => onChange(qty - 1)} className={clsx("press grid place-items-center rounded-full", s)}>
        <Minus size={16} />
      </button>
      <span className="min-w-6 text-center text-[15px] font-bold tabular-nums" aria-live="polite">{qty}</span>
      <button type="button" aria-label="Ko‘paytirish" onClick={() => onChange(qty + 1)} className={clsx("press grid place-items-center rounded-full", s)}>
        <Plus size={16} />
      </button>
    </div>
  );
}

export function Button({
  children, className, variant = "primary", loading, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "soft"; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={clsx(
        "press inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 text-[16px] font-bold disabled:opacity-50",
        variant === "primary" && "bg-accent text-accent-ink shadow-[0_8px_24px_-12px_rgb(156_71_88/0.7)]",
        variant === "soft" && "bg-accent-soft text-accent",
        variant === "ghost" && "border border-line bg-surface text-ink",
        className,
      )}
    >
      {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Empty({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="enter flex flex-col items-center px-8 pt-16 pb-8 text-center">
      <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-accent-soft text-accent">{icon}</div>
      <h2 className="font-display text-[26px] leading-tight font-semibold">{title}</h2>
      <p className="mt-2 max-w-xs text-muted">{text}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function BottomBar({ children }: { children: React.ReactNode }) {
  // Portalled to <body> so page transitions (transforms) never move it.
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);
  if (!host) return null;
  return createPortal(
    <div className="bottom-bar-in pointer-events-none fixed inset-x-0 z-40 px-3" style={{ bottom: "calc(var(--tabbar) + 2px)" }}>
      <div className="glass-strong pointer-events-auto mx-auto max-w-md rounded-[24px] p-2">{children}</div>
    </div>,
    host,
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[13px] text-muted">{hint}</span> : null}
    </label>
  );
}
