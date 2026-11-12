import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSettings, notifyIds } from "@/lib/data";
import { appUrl, notifyCustomer, orderText, statusKeyboard, tg, webhookSecret } from "@/lib/telegram";
import { ORDER_STATUS, type Order, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type Update = {
  message?: { chat: { id: number }; from?: { id: number; first_name?: string }; text?: string };
  callback_query?: {
    id: string; from: { id: number }; data?: string;
    message?: { chat: { id: number }; message_id: number };
  };
};

const CUSTOMER_TEXT: Partial<Record<OrderStatus, string>> = {
  accepted: "✅ Buyurtmangiz #{n} qabul qilindi. Tez orada tayyorlaymiz!",
  delivering: "🚚 Buyurtmangiz #{n} yo‘lda. Kuryer siz bilan bog‘lanadi.",
  done: "🎉 Buyurtmangiz #{n} yetkazildi. Xaridingiz uchun rahmat!",
  cancelled: "Buyurtmangiz #{n} bekor qilindi. Savollar bo‘lsa, shu yerga yozing.",
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

  if (text === "/id") {
    await tg("sendMessage", {
      chat_id, parse_mode: "HTML",
      text: `Sizning chat ID: <code>${chat_id}</code>\nBuni admin paneldagi “Sozlamalar → Buyurtmalar keladigan chat ID” maydoniga yozing.`,
    });
    return;
  }

  await tg("sendMessage", {
    chat_id,
    text: settings.welcome_text,
    reply_markup: { inline_keyboard: [[{ text: "🌹 Do‘konni ochish", web_app: { url: appUrl(req) } }]] },
  });
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
  const msg = CUSTOMER_TEXT[order.status];
  if (msg) await notifyCustomer(order, msg.replace("{n}", String(order.number)));
}
