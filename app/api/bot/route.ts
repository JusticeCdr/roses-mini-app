import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSettings, notifyIds } from "@/lib/data";
import { appUrl, notifyCustomer, orderText, statusKeyboard, tg, webhookSecret } from "@/lib/telegram";
import { ORDER_STATUS, type Customer, type Order, type OrderStatus } from "@/lib/types";
import { reverseGeocode, validCoords } from "@/lib/geo";
import { asLang, translate } from "@/lib/i18n";

const LOCATION_KEYBOARD_RU = {
  keyboard: [[{ text: "📍 Отправить местоположение", request_location: true }]],
  resize_keyboard: true,
  is_persistent: false,
};
const LOCATION_KEYBOARD = {
  keyboard: [[{ text: "📍 Joylashuvimni yuborish", request_location: true }]],
  resize_keyboard: true,
  is_persistent: false,
};

export const dynamic = "force-dynamic";

type Update = {
  message?: {
    chat: { id: number };
    from?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string };
    text?: string;
    location?: { latitude: number; longitude: number };
  };
  callback_query?: {
    id: string; from: { id: number }; data?: string;
    message?: { chat: { id: number }; message_id: number };
  };
};

const CUSTOMER_KEY: Partial<Record<OrderStatus, "b_accepted" | "b_delivering" | "b_done" | "b_cancelled">> = {
  accepted: "b_accepted", delivering: "b_delivering", done: "b_done", cancelled: "b_cancelled",
};

export async function POST(req: Request) {
  if (req.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = (await req.json()) as Update;
  try {
    if (update.message) await onMessage(req, update.message);
    if (update.callback_query) await onCallback(update.callback_query);
  } catch (e) {
    console.error("bot error", e);
  }
  return NextResponse.json({ ok: true });
}

async function onMessage(req: Request, m: NonNullable<Update["message"]>) {
  const chat_id = m.chat.id;
  const text = (m.text ?? "").trim();
  const settings = await getSettings();

  if (m.location) {
    const c = validCoords(m.location.latitude, m.location.longitude);
    if (!c) return;
    const id = String(m.from?.id ?? chat_id);
    const prev = await store().get<Customer>("customers", id);
    const address = (await reverseGeocode(c.lat, c.lng)) ?? prev?.address ?? "";
    await store().upsert<Customer>("customers", {
      id,
      first_name: prev?.first_name || m.from?.first_name || "",
      last_name: prev?.last_name || m.from?.last_name || "",
      username: prev?.username || m.from?.username || "",
      name: prev?.name || [m.from?.first_name, m.from?.last_name].filter(Boolean).join(" "),
      phone: prev?.phone ?? "",
      address,
      lat: c.lat,
      lng: c.lng,
      updated_at: new Date().toISOString(),
    });
    await tg("sendMessage", {
      chat_id,
      text: `✅ Joylashuvingiz saqlandi${address ? `:\n${address}` : ""}\nBuyurtma berishda manzil avtomatik to‘ldiriladi.`,
      reply_markup: { inline_keyboard: [[{ text: "🌹 Do‘konni ochish", web_app: { url: appUrl(req) } }]] },
    });
    return;
  }

  if (text === "/joylashuv" || text === "/location") {
    await tg("sendMessage", { chat_id, text: "Pastdagi tugmani bosing — joylashuvingizni bir bosishda yuboramiz 📍", reply_markup: LOCATION_KEYBOARD });
    return;
  }

  if (text === "/id") {
    await tg("sendMessage", {
      chat_id, parse_mode: "HTML",
      text: `Sizning chat ID: <code>${chat_id}</code>\nBuni admin paneldagi “Sozlamalar → Buyurtmalar keladigan chat ID” maydoniga yozing.`,
    });
    return;
  }

  const saved = await store().get<Customer>("customers", String(m.from?.id ?? chat_id)).catch(() => null);
  const ru = (saved?.lang ?? (m.from?.language_code === "ru" ? "ru" : "uz")) === "ru";
  const caption = (ru ? settings.welcome_text_ru || settings.welcome_text : settings.welcome_text).slice(0, 1000);
  const openBtn = { inline_keyboard: [[{ text: ru ? "🌹 Открыть магазин" : "🌹 Do‘konni ochish", web_app: { url: appUrl(req) } }]] };
  const photo = settings.welcome_image || `${appUrl(req)}/roses-welcome.jpg`;
  try {
    await tg("sendPhoto", { chat_id, photo, caption, reply_markup: openBtn });
  } catch {
    await tg("sendMessage", { chat_id, text: caption, reply_markup: openBtn });
  }
  if (text.startsWith("/start")) {
    await tg("sendMessage", {
      chat_id,
      text: ru
        ? "Чтобы быстро сохранить адрес доставки, нажмите кнопку «📍 Отправить местоположение» ниже."
        : "Yetkazib berish manzilini tez saqlash uchun pastdagi “📍 Joylashuvimni yuborish” tugmasini bosing.",
      reply_markup: ru ? LOCATION_KEYBOARD_RU : LOCATION_KEYBOARD,
    });
  }
}

async function onCallback(cq: NonNullable<Update["callback_query"]>) {
  const [kind, id, status] = (cq.data ?? "").split(":");
  if (kind !== "st" || !id || !(status in ORDER_STATUS)) return;

  const settings = await getSettings();
  if (!notifyIds(settings).includes(String(cq.from.id)) && !notifyIds(settings).includes(String(cq.message?.chat.id))) {
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Ruxsat yo‘q" });
    return;
  }
  const order = await store().update<Order>("orders", id, { status });
  await tg("answerCallbackQuery", { callback_query_id: cq.id, text: `Holat: ${ORDER_STATUS[order.status]}` });
  if (cq.message) {
    await tg("editMessageText", {
      chat_id: cq.message.chat.id, message_id: cq.message.message_id,
      text: orderText(order, true), parse_mode: "HTML", reply_markup: statusKeyboard(order),
      link_preview_options: { is_disabled: true },
    }).catch(() => {});
  }
  const key = CUSTOMER_KEY[order.status];
  if (key) await notifyCustomer(order, translate(asLang(order.lang), key, { n: order.number }));
}
