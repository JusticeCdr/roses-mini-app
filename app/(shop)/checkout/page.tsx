"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { CheckCircle2, Phone, Send } from "lucide-react";
import { useBackButton, useShop } from "@/components/shop-provider";
import { formatPhone, useContactRequest } from "@/components/customer-form";
import { BottomBar, Button, Field, PageHeader } from "@/components/ui";
import { Summary } from "@/components/summary";
import { useQuote } from "@/components/use-quote";
import { money } from "@/lib/format";
import type { Order } from "@/lib/types";

const DAYS = ["Imkon qadar tez", "Bugun", "Ertaga"] as const;
const SLOTS = ["09:00–12:00", "12:00–15:00", "15:00–18:00", "18:00–21:00"];
const PAYMENTS = ["Naqd pul", "Karta orqali (kuryerga)", "Click / Payme"];

export default function CheckoutPage() {
  useBackButton("/cart");
  const router = useRouter();
  const { cart, customer, me, api, promo, setPromo, clearCart, haptic, inTelegram, setCustomer } = useShop();
  const { quote, loading } = useQuote();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [day, setDay] = useState<(typeof DAYS)[number]>("Imkon qadar tez");
  const [slot, setSlot] = useState(SLOTS[1]);
  const [payment, setPayment] = useState(PAYMENTS[0]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Order | null>(null);
  const contact = useContactRequest(setPhone);

  useEffect(() => {
    setName((v) => v || customer?.name || me?.name || "");
    setPhone((v) => v || customer?.phone || "");
    setAddress((v) => v || customer?.address || "");
  }, [customer, me]);

  useEffect(() => {
    if (!cart.length && !done) router.replace("/cart");
  }, [cart.length, done, router]);

  async function submit() {
    setError(null);
    if (!name.trim() || phone.replace(/\D/g, "").length < 12 || address.trim().length < 3) {
      setError("Ism, to‘liq telefon raqam va manzilni kiriting");
      haptic("error");
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ order: Order }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart, promo: quote?.promo ? promo : "", name, phone, address, comment, payment,
          delivery_time: day === "Imkon qadar tez" ? day : `${day}, ${slot}`,
        }),
      });
      haptic("success");
      setCustomer({ ...(customer ?? { id: r.order.customer_id, first_name: "", last_name: "", username: "" }), name, phone, address });
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
        <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-sage text-ok"><CheckCircle2 size={48} /></div>
        <p className="text-[13px] font-semibold text-muted">Buyurtma #{done.number}</p>
        <h1 className="mt-1 font-display text-[36px] leading-[1.05] font-semibold">Rahmat! Buyurtmangiz qabul qilindi</h1>
        <p className="mt-3 max-w-xs text-muted">Operatorimiz tez orada {done.phone} raqamiga qo‘ng‘iroq qiladi. Holati haqida botga xabar yuboramiz.</p>
        <p className="mt-4 text-[20px] font-bold">{money(done.total)}</p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
          <Link href="/orders"><Button className="w-full">Buyurtmalarim</Button></Link>
          <Link href="/"><Button variant="ghost" className="w-full">Bosh sahifaga</Button></Link>
        </div>
      </div>
    );
  }

  const choice = (active: boolean) =>
    clsx("press min-h-11 rounded-full px-4 text-[14px] font-semibold", active ? "bg-ink text-white" : "border border-line bg-surface");

  return (
    <div style={{ paddingBottom: 96 }}>
      <PageHeader title="Rasmiylashtirish" back="/cart" />
      <div className="space-y-7 px-4">
        {!inTelegram ? (
          <div className="flex gap-3 rounded-[20px] bg-accent-soft p-4 text-[15px]">
            <Send size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <p>Buyurtma berish uchun do‘konni <b>Telegram bot</b> orqali oching — shunda buyurtmangiz holatini botda kuzatasiz.</p>
          </div>
        ) : null}

        <section aria-labelledby="who" className="space-y-4">
          <h2 id="who" className="font-display text-[24px] font-semibold">Kim uchun</h2>
          <Field label="Ism">
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </Field>
          <Field label="Telefon raqam">
            <div className="flex gap-2">
              <input className="field" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="+998 90 123 45 67" autoComplete="tel" />
              {contact.supported ? (
                <button type="button" onClick={contact.request} aria-label="Telegram raqamimni yuborish" className="press grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] bg-accent-soft text-accent"><Phone size={20} /></button>
              ) : null}
            </div>
          </Field>
          <Field label="Manzil" hint="Tuman, ko‘cha, uy, mo‘ljal">
            <textarea className="field min-h-[88px] resize-none" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
        </section>

        <section aria-labelledby="when" className="space-y-3">
          <h2 id="when" className="font-display text-[24px] font-semibold">Qachon</h2>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => <button key={d} type="button" className={choice(day === d)} onClick={() => setDay(d)} aria-pressed={day === d}>{d}</button>)}
          </div>
          {day !== "Imkon qadar tez" ? (
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => <button key={s} type="button" className={choice(slot === s)} onClick={() => setSlot(s)} aria-pressed={slot === s}>{s}</button>)}
            </div>
          ) : null}
        </section>

        <section aria-labelledby="pay" className="space-y-3">
          <h2 id="pay" className="font-display text-[24px] font-semibold">To‘lov</h2>
          <div className="space-y-2">
            {PAYMENTS.map((p) => (
              <label key={p} className={clsx("press flex min-h-[52px] items-center gap-3 rounded-[16px] border bg-surface px-4", payment === p ? "border-accent" : "border-line")}>
                <input type="radio" name="pay" className="h-5 w-5 accent-[var(--color-accent)]" checked={payment === p} onChange={() => setPayment(p)} />
                <span className="text-[15px] font-semibold">{p}</span>
              </label>
            ))}
          </div>
        </section>

        <Field label="Izoh (ixtiyoriy)" hint="Masalan: kartochkaga yoziladigan tilak">
          <textarea className="field min-h-[80px] resize-none" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>

        <Summary q={quote} loading={loading} />
        {error ? <p role="alert" className="text-[15px] font-semibold text-accent">{error}</p> : null}
      </div>

      <BottomBar>
        <Button className="w-full" loading={busy} disabled={!quote} onClick={submit}>
          Buyurtma berish{quote ? ` · ${money(quote.total)}` : ""}
        </Button>
      </BottomBar>
    </div>
  );
}
