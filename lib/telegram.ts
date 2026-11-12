import crypto from "crypto";
import { money } from "./format";
import { ORDER_STATUS, type Order, type OrderStatus } from "./types";

export type TgUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
};

const token = () => process.env.BOT_TOKEN ?? "";

/** Validates Telegram WebApp initData (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app). */
export function validateInitData(initData: string, maxAgeSec = 60 * 60 * 24 * 7): TgUser | null {
  const botToken = token();
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
  params.delete("hash");
  const dataCheck = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calc = crypto.createHmac("sha256", secret).update(dataCheck).digest("hex");
  const a = Buffer.from(calc, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) return null;
  try {
    return JSON.parse(params.get("user") ?? "null") as TgUser;
  } catch {
    return null;
  }
}

/** Telegram user of the request, or a demo user for local testing. */
export function requestUser(req: Request): TgUser | null {
  const user = validateInitData(req.headers.get("x-telegram-init-data") ?? "");
  if (user) return user;
  const demoAllowed = process.env.ALLOW_DEMO_USER === "1" || (process.env.NODE_ENV !== "production" && !token());
  return demoAllowed ? { id: 100000001, first_name: "Demo", username: "demo_user" } : null;
}

export function webhookSecret(): string {
  return crypto.createHash("sha256").update(`roses-webhook:${token()}`).digest("hex").slice(0, 48);
}

export async function tg<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  if (!token()) throw new Error("BOT_TOKEN o‘rnatilmagan");
  const r = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const j = (await r.json()) as { ok: boolean; result: T; description?: string };
  if (!j.ok) throw new Error(`Telegram: ${j.description ?? r.status}`);
  return j.result;
}

export function appUrl(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function orderText(o: Order, forOwner: boolean): string {
  const lines = [
    forOwner ? `🌹 <b>Yangi buyurtma #${o.number}</b>` : `🌹 <b>Buyurtma #${o.number}</b>`,
    `Holati: <b>${ORDER_STATUS[o.status]}</b>`,
    "",
    ...o.items.map((i) => `• ${esc(i.name)} × ${i.qty} — ${money(i.price * i.qty)}`),
    "",
    `Mahsulotlar: ${money(o.subtotal)}`,
  ];
  if (o.discount) lines.push(`Chegirma${o.promo_code ? ` (${esc(o.promo_code)})` : ""}: −${money(o.discount)}`);
  lines.push(`Yetkazib berish: ${o.delivery_fee ? money(o.delivery_fee) : "bepul"}`);
  lines.push(`<b>Jami: ${money(o.total)}</b>`, "");
  lines.push(`👤 ${esc(o.name)}`, `📞 ${esc(o.phone)}`, `📍 ${esc(o.address)}`, `🕒 ${esc(o.delivery_time)}`);
  lines.push(`💳 ${esc(o.payment)}`);
  if (o.comment) lines.push(`💬 ${esc(o.comment)}`);
  if (forOwner) {
    lines.push("", o.tg_username ? `Telegram: @${esc(o.tg_username)}` : `Telegram: <a href="tg://user?id=${o.customer_id}">mijoz</a>`);
  }
  return lines.join("\n");
}

export function statusKeyboard(o: Order) {
  const btn = (s: OrderStatus, label: string) => ({ text: (o.status === s ? "• " : "") + label, callback_data: `st:${o.id}:${s}` });
  return {
    inline_keyboard: [
      [btn("accepted", "✅ Qabul qilish"), btn("delivering", "🚚 Yo‘lda")],
      [btn("done", "🎉 Yetkazildi"), btn("cancelled", "✖️ Bekor qilish")],
    ],
  };
}

export async function notifyOwners(o: Order, chatIds: string[]): Promise<number> {
  let sent = 0;
  for (const chat_id of chatIds) {
    try {
      await tg("sendMessage", {
        chat_id, text: orderText(o, true), parse_mode: "HTML",
        reply_markup: statusKeyboard(o), link_preview_options: { is_disabled: true },
      });
      sent++;
    } catch (e) {
      console.error("notify owner failed", chat_id, e);
    }
  }
  return sent;
}

export async function notifyCustomer(o: Order, text?: string) {
  try {
    await tg("sendMessage", { chat_id: o.customer_id, text: text ?? orderText(o, false), parse_mode: "HTML" });
  } catch (e) {
    console.error("notify customer failed", e);
  }
}
