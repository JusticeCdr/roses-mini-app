"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useShop } from "./shop-provider";
import { CustomerForm } from "./customer-form";

const KEY = "roses_welcome_skip";

/** First-time registration inside Telegram: name, phone, address. */
export function WelcomeSheet() {
  const { inTelegram, meLoaded, customer, catalog, t } = useShop();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let skipped = false;
    try { skipped = sessionStorage.getItem(KEY) === "1"; } catch { /* ignore */ }
    setOpen(inTelegram && meLoaded && !customer && !skipped && path === "/");
  }, [inTelegram, meLoaded, customer, path]);

  if (!open) return null;
  const close = () => {
    try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/30 fade-in" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="sheet-in mx-auto max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-bg px-5 pt-3" style={{ paddingBottom: "calc(24px + var(--safe-bottom))" }}>
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-line" aria-hidden />
        <p className="text-[13px] font-semibold text-accent">{catalog?.settings.shop_name ?? "Roses"}</p>
        <h2 id="welcome-title" className="mt-1 font-display text-[32px] leading-[1.05] font-semibold">{t("welcomeTitle")}</h2>
        <p className="mt-2 mb-6 text-muted">{t("welcomeText")}</p>
        <CustomerForm submitLabel={t("register")} onSaved={() => setOpen(false)} />
        <button type="button" onClick={close} className="press mt-2 min-h-12 w-full rounded-2xl text-[15px] font-semibold text-muted">
          {t("later")}
        </button>
      </div>
    </div>
  );
}
