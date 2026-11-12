import { NextResponse } from "next/server";
import { errorJson, isAdmin, unauthorized } from "@/lib/admin-auth";
import { clean, ENTITIES } from "@/lib/admin-schema";
import { store, type Table } from "@/lib/store";
import { notifyCustomer } from "@/lib/telegram";
import { ORDER_STATUS, type Order } from "@/lib/types";

type Ctx = { params: Promise<{ entity: string; id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const { entity, id } = await params;
  const t = entity as Table;
  if (!ENTITIES[t]) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  try {
    const row = await store().update(t, id, clean(t, await req.json(), true));
    if (t === "orders" && process.env.BOT_TOKEN) {
      const o = row as Order;
      await notifyCustomer(o, `🌹 Buyurtmangiz #${o.number}: <b>${ORDER_STATUS[o.status]}</b>`);
    }
    return NextResponse.json({ row });
  } catch (e) {
    return errorJson(e, 400);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const { entity, id } = await params;
  const t = entity as Table;
  if (!ENTITIES[t]) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  try {
    await store().remove(t, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorJson(e, 400);
  }
}
