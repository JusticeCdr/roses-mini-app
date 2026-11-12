import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE = "roses_admin";

export function adminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : "admin123";
}

export function sessionToken(): string | null {
  const pw = adminPassword();
  if (!pw) return null;
  return crypto.createHmac("sha256", pw).update("roses-admin-session-v1").digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  const t = sessionToken();
  if (!t) return false;
  const c = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  const a = Buffer.from(c), b = Buffer.from(t);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function unauthorized() {
  return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
}

export function errorJson(e: unknown, status = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: msg }, { status });
}
