import { NextResponse } from "next/server";
import { errorJson, isAdmin, unauthorized } from "@/lib/admin-auth";
import { store } from "@/lib/store";
import { seedData } from "@/lib/seed";

export async function POST() {
  if (!(await isAdmin())) return unauthorized();
  try {
    const s = store();
    const d = seedData();
    for (const t of ["categories", "products", "banners", "promos"] as const) {
      for (const row of d[t]) await s.upsert(t, row as unknown as Record<string, unknown> & { id: string });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorJson(e);
  }
}
