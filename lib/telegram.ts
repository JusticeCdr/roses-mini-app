import crypto from "crypto";
import { money } from "./format";
import { mapLinks } from "./geo";
import { ORDER_STATUS, type Order, type OrderStatus } from "./types";
import { asLang, moneyIn, translate } from "./i18n";

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
  const lang = forOwner ? "uz" : asLang(o.lang);
  const m = (n: number) => moneyIn(lang, n);
  const t = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate(lang, k, v);
  const status = forOwner ? ORDER_STATUS[o.status] : t(`st_${o.status}` as Parameters<typeof translate>[1]);
  const name = (i: Order["items"][number]) => (lang === "ru" && i.name_ru ? i.name_ru : i.name);
  const lines = [
    forOwner ? `🌹 <b>Yangi buyurtma #${o.number}</b>${o.lang === "ru" ? " 🇷🇺" : ""}` : `🌹 <b>${t("b_order", { n: o.number })}</b>`,
    `${forOwner ? "Holati" : t("b_status")}: <b>${status}</b>`,
    "",
    ...o.items.map((i) => `• ${esc(name(i))} × ${i.qty} — ${m(i.price * i.qty)}`),
    "",
    `${forOwner ? "Mahsulotlar" : t("goods")}: ${m(o.subtotal)}`,
  ];
  if (o.discount) lines.push(`${forOwner ? "Chegirma" : t("discount")}${o.promo_code ? ` (${esc(o.promo_code)})` : ""}: −${m(o.discount)}`);
  lines.push(`${forOwner ? "Yetkazib berish" : t("delivery")}: ${o.delivery_fee ? m(o.delivery_fee) : forOwner ? "bepul" : t("free")}`);
  lines.push(`<b>${forOwner ? "Jami" : t("b_total")}: ${m(o.total)}</b>`, "");
  lines.push(`👤 ${esc(o.name)}`, `📞 ${esc(o.phone)}`, `📍 ${esc(o.address)}`);
  if (forOwner && o.lat != null && o.lng != null) {
    const ml = mapLinks(o.lat, o.lng);
    lines.push(`🗺 <a href="${ml.yandex}">Yandex xarita</a> · <a href="${ml.google}">Google xarita</a>`);
  }
  lines.push(`🕒 ${esc(o.delivery_time)}`);
  lines.push(`💳 ${esc(o.payment)}`);
  if (o.card_text) lines.push(`💌 ${forOwner ? "Otkritka" : t("cardMsg")}: ${esc(o.card_text)}`);
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
      if (o.lat != null && o.lng != null) {
        await tg("sendLocation", { chat_id, latitude: o.lat, longitude: o.lng }).catch(() => {});
      }
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

/** Multipart call (file uploads). */
export async function tgUpload<T = unknown>(method: string, form: FormData): Promise<T> {
  const r = await fetch(`https://api.telegram.org/bot${token()}/${method}`, { method: "POST", body: form, cache: "no-store" });
  const j = (await r.json()) as { ok: boolean; result: T; description?: string };
  if (!j.ok) throw new Error(`Telegram: ${j.description ?? r.status}`);
  return j.result;
}

/** Sets the bot's profile photo (Bot API setMyProfilePhoto). */
export async function setBotAvatar(imageUrl: string): Promise<boolean> {
  const img = await fetch(imageUrl, { cache: "no-store" });
  if (!img.ok) throw new Error("Avatar rasmi topilmadi");
  const form = new FormData();
  form.append("photo", JSON.stringify({ type: "static", photo: "attach://avatar" }));
  form.append("avatar", new Blob([await img.arrayBuffer()], { type: "image/jpeg" }), "avatar.jpg");
  return tgUpload<boolean>("setMyProfilePhoto", form);
}

/** Webhook + menu button + commands. Used by the admin button and the one-time setup link. */
export async function setupBot(url: string): Promise<{ bot: string; url: string; avatar: string }> {
  if (!url.startsWith("https://")) throw new Error("Bot faqat https manzil bilan ishlaydi — avval Vercel’ga yuklang");
  await tg("setWebhook", {
    url: `${url}/api/bot`, secret_token: webhookSecret(),
    allowed_updates: ["message", "callback_query"], drop_pending_updates: true,
  });
  await tg("setChatMenuButton", { menu_button: { type: "web_app", text: "Do‘kon", web_app: { url } } });
  const commands = (lang: "uz" | "ru") => lang === "ru"
    ? [{ command: "start", description: "Открыть магазин" }, { command: "joylashuv", description: "Отправить местоположение" }]
    : [{ command: "start", description: "Do‘konni ochish" }, { command: "joylashuv", description: "Joylashuvni yuborish" }, { command: "id", description: "Chat ID (admin uchun)" }];
  await tg("setMyCommands", { commands: commands("uz") });
  await tg("setMyCommands", { commands: commands("ru"), language_code: "ru" }).catch(() => {});
  await tg("setMyDescription", { description: "🌹 Roses — buketlar, atirgullar va qutidagi gullar. Telegram ichida tanlang va buyurtma bering." }).catch(() => {});
  await tg("setMyDescription", { description: "🌹 Roses — букеты, розы и цветы в коробке. Выбирайте и заказывайте прямо в Telegram.", language_code: "ru" }).catch(() => {});
  await tg("setMyShortDescription", { short_description: "Roses — gul do‘koni 🌹" }).catch(() => {});
  let avatar = "ok";
  try { await setBotAvatar(`${url}/roses-avatar.jpg`); } catch (e) { avatar = (e as Error).message; }
  const me = await tg<{ username: string }>("getMe", {});
  return { bot: me.username, url, avatar };
}
