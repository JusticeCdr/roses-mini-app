import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { requestUser } from "@/lib/telegram";
import { errorJson } from "@/lib/admin-auth";
import type { Customer } from "@/lib/types";
import { validCoords } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = requestUser(req);
  if (!u) return NextResponse.json({ user: null, customer: null });
  try {
    const customer = await store().get<Customer>("customers", String(u.id));
    return NextResponse.json({ user: u, customer });
  } catch (e) {
    return errorJson(e);
  }
}

export async function PUT(req: Request) {
  const u = requestUser(req);
  if (!u) return NextResponse.json({ error: "Telegram orqali oching" }, { status: 401 });
  try {
    const b = (await req.json()) as Partial<Customer>;
    const name = String(b.name ?? "").trim().slice(0, 80);
    const phone = String(b.phone ?? "").trim().slice(0, 30);
    const address = String(b.address ?? "").trim().slice(0, 300);
    if (!name || phone.replace(/\D/g, "").length < 9) {
      return NextResponse.json({ error: "Ism va telefon raqamini to‘g‘ri kiriting" }, { status: 400 });
    }
    const coords = validCoords(b.lat, b.lng);
    const customer = await store().upsert<Customer>("customers", {
      ...(coords ? coords : {}),
      id: String(u.id),
      first_name: u.first_name ?? "",
      last_name: u.last_name ?? "",
      username: u.username ?? "",
      name, phone, address,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ customer });
  } catch (e) {
    return errorJson(e);
  }
}
