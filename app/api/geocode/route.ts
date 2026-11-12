import { NextResponse } from "next/server";
import { reverseGeocode, validCoords } from "@/lib/geo";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const c = validCoords(u.searchParams.get("lat"), u.searchParams.get("lng"));
  if (!c) return NextResponse.json({ error: "Koordinata noto‘g‘ri" }, { status: 400 });
  const address = await reverseGeocode(c.lat, c.lng);
  return NextResponse.json({ ...c, address }, { headers: { "cache-control": "public, max-age=86400" } });
}
