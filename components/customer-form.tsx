"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import type { Customer } from "@/lib/types";
import { useShop } from "./shop-provider";
import { Button, Field } from "./ui";
import { LocateButton } from "./locate";

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (!d) return "";
  const n = d.startsWith("998") ? d.slice(3) : d;
  const p = n.slice(0, 9);
  const parts = [p.slice(0, 2), p.slice(2, 5), p.slice(5, 7), p.slice(7, 9)].filter(Boolean);
  return `+998 ${parts.join(" ")}`.trim();
}

export function useContactRequest(onPhone: (p: string) => void) {
  const { tg, haptic } = useShop();
  const supported = Boolean(tg?.requestContact && tg.isVersionAtLeast?.("6.9"));
  const request = () =>
    tg?.requestContact?.((ok, res) => {
      const phone = res?.responseUnsafe?.contact?.phone_number;
      if (ok && phone) {
        haptic("success");
        onPhone(formatPhone(phone));
      }
    });
  return { supported, request };
}

export function CustomerForm({ submitLabel, onSaved, autoLocate }: { submitLabel: string; onSaved?(c: Customer): void; autoLocate?: boolean }) {
  const { customer, me, api, setCustomer, haptic, inTelegram, t, lang } = useShop();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contact = useContactRequest(setPhone);

  useEffect(() => {
    setName(customer?.name || me?.name || "");
    setPhone(customer?.phone || "");
    setAddress(customer?.address || "");
    setCoords(customer?.lat != null && customer?.lng != null ? { lat: customer.lat, lng: customer.lng } : null);
  }, [customer, me]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await api<{ customer: Customer }>("/api/me", { method: "PUT", body: JSON.stringify({ name, phone, address, lang, ...(coords ?? {}) }) });
      setCustomer(r.customer);
      haptic("success");
      onSaved?.(r.customer);
    } catch (err) {
      haptic("error");
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label={t("name")}>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder={t("namePh")} required />
      </Field>
      <Field label={t("phone")}>
        <div className="flex gap-2">
          <input
            className="field"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            autoComplete="tel"
            placeholder="+998 90 123 45 67"
            required
          />
          {contact.supported ? (
            <button type="button" onClick={contact.request} aria-label={t("sendPhone")} className="press grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] bg-accent-soft text-accent">
              <Phone size={20} />
            </button>
          ) : null}
        </div>
      </Field>
      <div>
        <span className="mb-1.5 block text-[13px] font-semibold text-muted">{t("location")}</span>
        <LocateButton
          coords={coords}
          auto={autoLocate}
          onLocated={(l) => { setCoords({ lat: l.lat, lng: l.lng }); if (l.address) setAddress(l.address); }}
        />
      </div>
      <Field label={t("deliveryAddress")} hint={t("addressHint2")}>
        <textarea className="field min-h-[88px] resize-none" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Chilonzor, Bunyodkor ko‘chasi…" rows={3} />
      </Field>
      {error ? <p role="alert" className="text-[15px] font-semibold text-rose">{error}</p> : null}
      {!inTelegram ? <p className="text-[15px] text-muted">{t("saveViaTg")}</p> : null}
      <Button type="submit" className="w-full" loading={busy}>{submitLabel}</Button>
    </form>
  );
}
