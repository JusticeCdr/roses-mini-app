"use client";

import { useState } from "react";
import { Check, Clock, MapPin, Phone } from "lucide-react";
import { useShop } from "@/components/shop-provider";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/ui";

export default function ProfilePage() {
  const { me, customer, catalog } = useShop();
  const [saved, setSaved] = useState(false);
  const s = catalog?.settings;
  const display = customer?.name || me?.name || "Mehmon";

  return (
    <div>
      <PageHeader title="Profil" />
      <div className="px-4">
        <div className="flex items-center gap-4 rounded-[22px] bg-surface p-4 shadow-soft">
          {me?.photo ? (
            <img src={me.photo} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-soft font-display text-[26px] font-bold text-accent">{display.charAt(0)}</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[18px] font-bold">{display}</p>
            <p className="truncate text-[14px] text-muted">{me?.username ? `@${me.username}` : customer?.phone || "Telegram orqali kiring"}</p>
          </div>
        </div>

        <section aria-labelledby="mydata" className="mt-8">
          <h2 id="mydata" className="mb-4 font-display text-[24px] font-semibold">Ma’lumotlarim</h2>
          <CustomerForm submitLabel={saved ? "Saqlandi" : "Saqlash"} onSaved={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} />
          {saved ? <p className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-ok"><Check size={16} /> O‘zgarishlar saqlandi</p> : null}
        </section>

        {s && (s.phone || s.address || s.work_hours) ? (
          <section aria-labelledby="shop" className="mt-10">
            <h2 id="shop" className="mb-3 font-display text-[24px] font-semibold">{s.shop_name} bilan aloqa</h2>
            <ul className="divide-y divide-line rounded-[20px] bg-surface">
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
