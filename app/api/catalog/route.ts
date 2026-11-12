import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/data";
import { errorJson } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getCatalog(), { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return errorJson(e);
  }
}
