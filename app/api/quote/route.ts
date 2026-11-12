import { NextResponse } from "next/server";
import { quote } from "@/lib/data";
import { errorJson } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { items?: { id: string; qty: number }[]; promo?: string };
    const q = await quote((b.items ?? []).slice(0, 50), b.promo ?? null);
    return NextResponse.json({
      subtotal: q.subtotal, discount: q.discount, delivery_fee: q.delivery_fee, total: q.total,
      promo: q.promo ? { code: q.promo.code, title: q.promo.title } : null,
      promoError: q.promoError,
      available: q.items.map((i) => i.product_id),
    });
  } catch (e) {
    return errorJson(e);
  }
}
