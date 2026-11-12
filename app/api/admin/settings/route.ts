import { NextResponse } from "next/server";
import { errorJson, isAdmin, unauthorized } from "@/lib/admin-auth";
import { getSettings, saveSettings } from "@/lib/data";
import { DEFAULT_SETTINGS } from "@/lib/seed";
import type { Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const b = (await req.json()) as Partial<Settings>;
    const patch: Partial<Settings> = {};
    for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      if (!(k in b)) continue;
      const def = DEFAULT_SETTINGS[k];
      (patch as Record<string, unknown>)[k] = typeof def === "number" ? Math.max(0, Number(b[k]) || 0) : String(b[k] ?? "").slice(0, 2000);
    }
    return NextResponse.json({ settings: await saveSettings(patch) });
  } catch (e) {
    return errorJson(e);
  }
}
