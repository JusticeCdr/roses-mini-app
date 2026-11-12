import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSettings, notifyIds } from "@/lib/data";
import { appUrl, notifyCustomer, requestUser, sendReceiptToOwners } from "@/lib/telegram";
import { toWebp } from "@/lib/image";
import { asLang, reqLang, translate } from "@/lib/i18n";
import { errorJson } from "@/lib/admin-auth";
import type { Order } from "@/lib/types";

export const runtime = "nodejs";

/** Customer uploads a payment receipt for their own order. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const lang = reqLang(req);
  const u = requestUser(req);
  if (!u) return NextResponse.json({ error: translate(lang, "e_tg") }, { status: 401 });
  try {
    const { id } = await params;
    const order = await store().get<Order>("orders", id);
    if (!order || order.customer_id !== String(u.id)) return NextResponse.json({ error: translate(lang, "e_generic") }, { status: 404 });
    const file = (await req.formData()).get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 6 * 1024 * 1024) {
      return NextResponse.json({ error: translate(lang, "e_generic") }, { status: 400 });
    }
    const webp = await toWebp(Buffer.from(await file.arrayBuffer()));
    let url = await store().upload(webp.data, `chek-${order.number}.webp`, "image/webp");
    if (url.startsWith("/")) url = `${appUrl(req)}${url}`;
    const updated = await store().update<Order>("orders", id, { receipt_url: url });
    if (process.env.BOT_TOKEN) {
      await sendReceiptToOwners(updated, url, notifyIds(await getSettings()));
      await notifyCustomer(updated, translate(asLang(order.lang), "b_receiptOk", { n: order.number }));
    }
    return NextResponse.json({ ok: true, receipt_url: url });
  } catch (e) {
    return errorJson(e);
  }
}
