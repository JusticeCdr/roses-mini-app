import { NextResponse } from "next/server";
import { errorJson, isAdmin, unauthorized } from "@/lib/admin-auth";
import { clean, ENTITIES, READ_ONLY } from "@/lib/admin-schema";
import { store, type Table } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ entity: string }> };

const ORDER: Record<string, [string, "asc" | "desc"][]> = {
  orders: [["created_at", "desc"]], customers: [["created_at", "desc"]], promos: [["created_at", "desc"]],
};

export async function GET(_: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const t = (await params).entity as Table;
  if (!ENTITIES[t] && !READ_ONLY.includes(t)) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  try {
    const rows = await store().list(t, { order: ORDER[t] ?? [["sort", "asc"], ["created_at", "desc"]], limit: 500 });
    return NextResponse.json({ rows });
  } catch (e) {
    return errorJson(e);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const t = (await params).entity as Table;
  if (!ENTITIES[t] || t === "orders") return NextResponse.json({ error: "Ruxsat yo‘q" }, { status: 400 });
  try {
    const row = clean(t, await req.json(), false);
    if (t === "promos") (row as Record<string, unknown>).uses = 0;
    const created = await store().insert(t, { id: crypto.randomUUID(), ...row, created_at: new Date().toISOString() });
    return NextResponse.json({ row: created });
  } catch (e) {
    return errorJson(e, 400);
  }
}
