import crypto from "crypto";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPassword, isAdmin, sessionToken } from "@/lib/admin-auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    authed: await isAdmin(),
    configured: adminPassword() !== null,
    storage: store().kind,
    bot: Boolean(process.env.BOT_TOKEN),
  });
}

export async function POST(req: Request) {
  const pw = adminPassword();
  if (!pw) return NextResponse.json({ error: "Vercel’da ADMIN_PASSWORD o‘zgaruvchisini o‘rnating" }, { status: 500 });
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const a = crypto.createHash("sha256").update(String(password ?? "")).digest();
  const b = crypto.createHash("sha256").update(pw).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Parol noto‘g‘ri" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, sessionToken()!, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
