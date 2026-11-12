import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSettings, notifyIds, quote } from "@/lib/data";
import { notifyCustomer, notifyOwners, requestUser } from "@/lib/telegram";
import { errorJson } from "@/lib/admin-auth";
import type { Customer, Order, Promo } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = requestUser(req);
  if (!u) return NextResponse.json({ orders: [] });
  try {
    const orders = await store().list<Order>("orders", {
      where: { customer_id: String(u.id) }, order: [["created_at", "desc"]], limit: 50,
    });
    return NextResponse.json({ orders });
  } catch (e) {
    return errorJson(e);
  }
}

export async function POST(req: Request) {
  const u = requestUser(req);
  if (!u) return NextResponse.json({ error: "Buyurtma berish uchun do‘konni Telegram bot orqali oching" }, { status: 401 });
  try {
    const b = (await req.json()) as {
      items?: { id: string; qty: number }[]; promo?: string; name?: string; phone?: string;
      address?: string; delivery_time?: string; comment?: string; payment?: string;
    };
    const name = String(b.name ?? "").trim().slice(0, 80);
    const phone = String(b.phone ?? "").trim().slice(0, 30);
    const address = String(b.address ?? "").trim().slice(0, 300);
    if (!name || phone.replace(/\D/g, "").length < 9 || address.length < 3) {
      return NextResponse.json({ error: "Ism, telefon va manzilni to‘ldiring" }, { status: 400 });
    }
    const [q, settings] = await Promise.all([quote((b.items ?? []).slice(0, 50), b.promo || null), getSettings()]);
    if (!q.items.length) return NextResponse.json({ error: "Savatcha bo‘sh yoki mahsulotlar tugagan" }, { status: 400 });
    if (b.promo && q.promoError) return NextResponse.json({ error: q.promoError }, { status: 400 });
    if (settings.min_order && q.subtotal < settings.min_order) {
      return NextResponse.json({ error: `Eng kam buyurtma: ${settings.min_order.toLocaleString("ru-RU")} so‘m` }, { status: 400 });
    }

    const s = store();
    if (q.promo) {
      const used = await s.list<Order>("orders", { where: { customer_id: String(u.id), promo_code: q.promo.code }, limit: 1 });
      if (used.some((o) => o.status !== "cancelled")) {
        return NextResponse.json({ error: "Bu promo-koddan avval foydalangansiz" }, { status: 400 });
      }
    }
    const order = await s.insert<Order>("orders", {
      id: crypto.randomUUID(),
      number: 1001 + (await s.count("orders")),
      customer_id: String(u.id),
      tg_username: u.username ?? "",
      items: q.items,
      subtotal: q.subtotal, discount: q.discount, delivery_fee: q.delivery_fee, total: q.total,
      promo_code: q.promo?.code ?? null,
      name, phone, address,
      delivery_time: String(b.delivery_time ?? "Imkon qadar tez").slice(0, 80),
      comment: String(b.comment ?? "").trim().slice(0, 500),
      payment: String(b.payment ?? "Naqd").slice(0, 40),
      status: "new",
      created_at: new Date().toISOString(),
    });
    if (q.promo) await s.update<Promo>("promos", q.promo.id, { uses: (q.promo.uses ?? 0) + 1 });

    // Save the details for next time (registration).
    await s.upsert<Customer>("customers", {
      id: String(u.id), first_name: u.first_name ?? "", last_name: u.last_name ?? "",
      username: u.username ?? "", name, phone, address, updated_at: new Date().toISOString(),
    });

    if (process.env.BOT_TOKEN) {
      await Promise.all([notifyOwners(order, notifyIds(settings)), notifyCustomer(order)]);
    }
    return NextResponse.json({ order });
  } catch (e) {
    return errorJson(e);
  }
}
