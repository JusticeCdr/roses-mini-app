"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Banknote, Check, CheckCircle2, Copy, CreditCard, Phone, Send } from "lucide-react";
import { useBackButton, useShop } from "@/components/shop-provider";
import { formatPhone, useContactRequest } from "@/components/customer-form";
import { LocateButton } from "@/components/locate";
import { ReceiptButton } from "@/components/receipt-button";
import { BottomBar, Button, Field, PageHeader } from "@/components/ui";
import { Summary } from "@/components/summary";
import { useQuote } from "@/components/use-quote";
import { dayLabel, translate } from "@/lib/i18n";
import { formatCard } from "@/lib/format";
import type { Order } from "@/lib/types";

const SLOTS = ["09:00–12:00", "12:00–15:00", "15:00–18:00", "18:00–21:00"];

export default function CheckoutPage() {
  useBackButton("/cart");
  const router = useRouter();
  const { cart, cartLoaded, customer, me, api, promo, setPromo, clearCart, haptic, inTelegram, setCustomer, catalog, t, money, lang } = useShop();
  const { quote, loading } = useQuote();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [day, setDay] = useState<number>(-1); // -1 = as soon as possible, otherwise days from today
  const [slot, setSlot] = useState(SLOTS[1]);
  const [payment, setPayment] = useState<"cash" | "card">("cash");
  const [comment, setComment] = useState("");
  const [cardText, setCardText] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Order | null>(null);
  const contact = useContactRequest(setPhone);
  const s = catalog?.settings;
  const card = s?.card_number ? formatCard(s.card_number) : "";

  const days = useMemo(() => {
    const out: Date[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) out.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
    return out;
  }, []);

  useEffect(() => {
    setName((v) => v || customer?.name || me?.name || "");
    setPhone((v) => v || customer?.phone || "");
    setAddress((v) => v || customer?.address || "");
    setCoords((v) => v ?? (customer?.lat != null && customer?.lng != null ? { lat: customer.lat, lng: customer.lng } : null));
  }, [customer, me]);

  useEffect(() => {
    if (cartLoaded && !cart.length && !done) router.replace("/cart");
  }, [cartLoaded, cart.length, done, router]);

  // The delivery time is stored in Uzbek for the shop owner.
  const deliveryText = () => {
    if (day < 0) return translate("uz", "asap");
    const d = days[day];
    const date = dayLabel("uz", d).full;
    const label = day === 0 ? `${translate("uz", "today")} (${date})` : day === 1 ? `${translate("uz", "tomorrow")} (${date})` : date;
    return `${label}, ${slot}`;
  };

  async function copyCard() {
    try { await navigator.clipboard.writeText(s?.card_number.replace(/\D/g, "") ?? ""); } catch { /* ignore */ }
    setCopied(true);
    haptic("success");
    setTimeout(() => setCopied(false), 2000);
  }

  async function submit() {
    setError(null);
    if (!name.trim() || phone.replace(/\D/g, "").length < 12 || address.trim().length < 3) {
      setError(t("fillAll"));
      haptic("error");
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ order: Order }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart, promo: quote?.promo ? promo : "", name, phone, address, comment, payment,
          card_text: cardText, delivery_time: deliveryText(), ...(coords ?? {}),
        }),
      });
      haptic("success");
      setCustomer({ ...(customer ?? { id: r.order.customer_id, first_name: "", last_name: "", username: "" }), name, phone, address, lat: coords?.lat ?? customer?.lat, lng: coords?.lng ?? customer?.lng });
      setDone(r.order);
      clearCart();
      setPromo("");
      window.scrollTo({ top: 0 });
    } catch (e) {
      haptic("error");
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="enter flex min-h-[80dvh] flex-col items-center justify-center px-8 text-center">
        <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-accent-soft text-accent"><CheckCircle2 size={48} /></div>
        <p className="text-[13px] font-semibold text-muted">{t("orderN", { n: done.number })}</p>
        <h1 className="mt-1 font-display text-[36px] leading-[1.05] font-semibold">{t("thanks")}</h1>
        <p className="mt-3 max-w-xs text-muted">{t("thanksText", { phone: done.phone })}</p>
        <p className="mt-4 text-[20px] font-bold">{money(done.total)}</p>
        {payment === "card" && card ? (
          <div className="card-face mt-5 w-full max-w-xs rounded-[20px] p-4 text-left text-white">
            <p className="text-[12px] font-semibold text-white/75">{t("cardTitle")}</p>
            <p className="mt-1 font-mono text-[19px] font-bold tracking-wider">{card}</p>
            {s?.card_holder ? <p className="text-[14px] text-white/85 uppercase">{s.card_holder}</p> : null}
            <button type="button" onClick={copyCard} className="press mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-bold text-accent">
              {copied ? <><Check size={15} /> {t("copied")}</> : <><Copy size={15} /> {t("copy")}</>}
            </button>
          </div>
        ) : null}
        {payment === "card" && card ? <div className="mt-3 w-full max-w-xs text-left"><ReceiptButton orderId={done.id} /></div> : null}
        <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
          <Link href="/orders"><Button className="w-full">{t("myOrders")}</Button></Link>
          <Link href="/"><Button variant="ghost" className="w-full">{t("toHome")}</Button></Link>
        </div>
      </div>
    );
  }

  const chip = (active: boolean) =>
    clsx("press min-h-11 rounded-full px-4 text-[14px] font-semibold", active ? "bg-ink text-white" : "bg-surface shadow-soft");

  return (
    <div style={{ paddingBottom: 96 }}>
      <PageHeader title={t("checkout")} back="/cart" />
      <div className="space-y-8 px-4">
        {!inTelegram ? (
          <div className="flex gap-3 rounded-[20px] bg-accent-soft p-4 text-[15px]">
            <Send size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <p>{t("openViaBot")}</p>
          </div>
        ) : null}

        <section aria-labelledby="who" className="space-y-4">
          <h2 id="who" className="font-display text-[26px] font-semibold">{t("forWhom")}</h2>
          <Field label={t("name")}>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </Field>
          <Field label={t("phone")}>
            <div className="flex gap-2">
              <input className="field" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="+998 90 123 45 67" autoComplete="tel" />
              {contact.supported ? (
                <button type="button" onClick={contact.request} aria-label={t("sendPhone")} className="press grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] bg-accent-soft text-accent"><Phone size={20} /></button>
              ) : null}
            </div>
          </Field>
          <LocateButton coords={coords} onLocated={(l) => { setCoords({ lat: l.lat, lng: l.lng }); if (l.address) setAddress(l.address); }} />
          <Field label={t("address")} hint={t("addressHint")}>
            <textarea className="field min-h-[88px] resize-none" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
        </section>

        <section aria-labelledby="when" className="space-y-3">
          <h2 id="when" className="font-display text-[26px] font-semibold">{t("when")}</h2>
          <button type="button" onClick={() => setDay(-1)} aria-pressed={day < 0} className={chip(day < 0)}>{t("asap")}</button>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-1 pb-2" aria-label={t("when")}>
            {days.map((d, i) => {
              const l = dayLabel(lang, d);
              const on = day === i;
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { setDay(i); haptic("select"); }}
                  className={clsx("press flex h-[70px] w-[60px] shrink-0 flex-col items-center justify-center rounded-[18px] transition-colors", on ? "bg-accent text-accent-ink shadow-[0_10px_24px_-12px_rgb(47_93_70/0.8)]" : "bg-surface shadow-soft")}
                >
                  <span className={clsx("text-[11px] font-semibold", on ? "text-white/80" : "text-muted")}>{i === 0 ? t("today") : i === 1 ? t("tomorrow") : l.top}</span>
                  <span className="text-[21px] leading-tight font-bold">{l.bottom}</span>
                </button>
              );
            })}
          </div>
          {day >= 0 ? (
            <div className="fade-in">
              <p className="mb-2 text-[13px] font-semibold text-muted">{t("time")} · {dayLabel(lang, days[day]).full}</p>
              <div className="flex flex-wrap gap-2">
                {SLOTS.map((sl) => <button key={sl} type="button" className={chip(slot === sl)} onClick={() => setSlot(sl)} aria-pressed={slot === sl}>{sl}</button>)}
              </div>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="pay" className="space-y-2">
          <h2 id="pay" className="mb-1 font-display text-[26px] font-semibold">{t("payment")}</h2>
          <PayOption on={payment === "cash"} onClick={() => setPayment("cash")} icon={<Banknote size={20} />} label={t("payCash")} />
          {card ? (
            <>
              <PayOption on={payment === "card"} onClick={() => setPayment("card")} icon={<CreditCard size={20} />} label={t("payCard")} />
              {payment === "card" ? (
                <div className="card-face fade-in relative overflow-hidden rounded-[22px] p-5 text-white">
                  <p className="text-[12px] font-semibold tracking-wide text-white/75 uppercase">{s?.card_bank || t("cardTitle")}</p>
                  <p className="mt-5 font-mono text-[22px] font-bold tracking-[0.12em]">{card}</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <p className="text-[14px] font-semibold text-white/90 uppercase">{s?.card_holder}</p>
                    <button type="button" onClick={copyCard} className="press inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/95 px-4 text-[14px] font-bold text-accent">
                      {copied ? <><Check size={15} /> {t("copied")}</> : <><Copy size={15} /> {t("copy")}</>}
                    </button>
                  </div>
                  <p className="mt-4 text-[13px] leading-snug text-white/80">{t("cardNote")}</p>
                </div>
              ) : null}
            </>
          ) : null}
        </section>

        <section className="space-y-4">
          <Field label={`${t("cardMsg")} (${t("optional")})`}>
            <textarea className="field min-h-[80px] resize-none" rows={2} maxLength={300} value={cardText} onChange={(e) => setCardText(e.target.value)} placeholder={t("cardMsgPh")} />
          </Field>
          <Field label={`${t("comment")} (${t("optional")})`}>
            <textarea className="field min-h-[80px] resize-none" rows={2} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("commentPh")} />
          </Field>
        </section>

        <Summary q={quote} loading={loading} />
        {error ? <p role="alert" className="text-[15px] font-semibold text-rose">{error}</p> : null}
      </div>

      <BottomBar>
        <Button className="w-full" loading={busy} disabled={!quote} onClick={submit}>
          {t("placeOrder")}{quote ? ` · ${money(quote.total)}` : ""}
        </Button>
      </BottomBar>
    </div>
  );
}

function PayOption({ on, onClick, icon, label }: { on: boolean; onClick(): void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={clsx("press flex min-h-[56px] w-full items-center gap-3 rounded-[16px] border-2 bg-surface px-4 text-left", on ? "border-accent" : "border-transparent shadow-soft")}
    >
      <span className={clsx("grid h-9 w-9 place-items-center rounded-full", on ? "bg-accent text-accent-ink" : "bg-well text-ink")}>{icon}</span>
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      <span className={clsx("grid h-5 w-5 place-items-center rounded-full border-2", on ? "border-accent bg-accent" : "border-line")}>
        {on ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
      </span>
    </button>
  );
}
