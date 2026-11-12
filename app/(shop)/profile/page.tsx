"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { Check, Clock, Languages, MapPin, Phone } from "lucide-react";
import { useShop } from "@/components/shop-provider";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/ui";
import { LANGS } from "@/lib/i18n";

export default function ProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}

function Profile() {
  const params = useSearchParams();
  const { me, customer, catalog, t, lang, setLang, api, inTelegram } = useShop();
  const [saved, setSaved] = useState(false);
  const s = catalog?.settings;
  const display = customer?.name || me?.name || t("guest");

  const changeLang = (l: typeof lang) => {
    setLang(l);
    // Remember it on the server too, so bot messages come in the same language.
    if (inTelegram && customer) {
      api("/api/me", { method: "PUT", body: JSON.stringify({ ...customer, lang: l }), headers: { "x-lang": l } }).catch(() => {});
    }
  };
  const idx = LANGS.findIndex((x) => x.id === lang);

  return (
    <div>
      <PageHeader title={t("profile")} />
      <div className="px-4">
        <div className="flex items-center gap-4 rounded-[22px] bg-surface p-4 shadow-soft">
          {me?.photo ? (
            <img src={me.photo} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-soft font-display text-[26px] font-bold text-accent">{display.charAt(0)}</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[18px] font-bold">{display}</p>
            <p className="truncate text-[14px] text-muted">{me?.username ? `@${me.username}` : customer?.phone || t("loginViaTg")}</p>
          </div>
        </div>

        <section aria-labelledby="lang" className="mt-6">
          <h2 id="lang" className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-muted"><Languages size={15} /> {t("language")}</h2>
          <div className="relative grid grid-cols-2 rounded-[18px] bg-surface p-1 shadow-soft" role="radiogroup" aria-labelledby="lang">
            <span
              aria-hidden
              className="tab-indicator absolute top-1 bottom-1 left-1 rounded-[14px]"
              style={{ width: "calc(50% - 4px)", transform: `translateX(${idx * 100}%)` }}
            />
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={lang === l.id}
                onClick={() => changeLang(l.id)}
                className={clsx("relative z-10 flex min-h-12 items-center justify-center gap-2 rounded-[14px] text-[15px] font-semibold transition-colors", lang === l.id ? "text-accent" : "text-muted")}
              >
                <span aria-hidden>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="mydata" className="mt-8">
          <h2 id="mydata" className="mb-4 font-display text-[26px] font-semibold">{t("myData")}</h2>
          <CustomerForm autoLocate={params.get("locate") === "1"} submitLabel={saved ? t("saved") : t("save")} onSaved={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} />
          {saved ? <p className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-accent"><Check size={16} /> {t("savedChanges")}</p> : null}
        </section>

        {s && (s.phone || s.address || s.work_hours) ? (
          <section aria-labelledby="shop" className="mt-10">
            <h2 id="shop" className="mb-3 font-display text-[26px] font-semibold">{t("contactShop", { shop: s.shop_name })}</h2>
            <ul className="divide-y divide-line rounded-[20px] bg-surface shadow-soft">
              {s.phone ? (
                <li><a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} className="press flex min-h-14 items-center gap-3 px-4"><Phone size={18} className="text-accent" /> {s.phone}</a></li>
              ) : null}
              {s.address ? <li className="flex min-h-14 items-center gap-3 px-4"><MapPin size={18} className="shrink-0 text-accent" /> {s.address}</li> : null}
              {s.work_hours ? <li className="flex min-h-14 items-center gap-3 px-4"><Clock size={18} className="text-accent" /> {s.work_hours}</li> : null}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
