import crypto from "crypto";
import { NextResponse } from "next/server";
import { appUrl, setupBot, webhookSecret } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/** One-time setup link: /api/telegram-setup?key=<secret derived from BOT_TOKEN>. */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  const a = Buffer.from(key), b = Buffer.from(webhookSecret());
  if (!process.env.BOT_TOKEN || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await setupBot(appUrl(req))) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
