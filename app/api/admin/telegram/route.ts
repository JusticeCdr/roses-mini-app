import { NextResponse } from "next/server";
import { errorJson, isAdmin, unauthorized } from "@/lib/admin-auth";
import { getSettings, notifyIds } from "@/lib/data";
import { appUrl, tg, webhookSecret } from "@/lib/telegram";

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const { action } = (await req.json()) as { action: "setup" | "test" };
    const url = appUrl(req);
    if (action === "setup") {
      if (!url.startsWith("https://")) throw new Error("Bot faqat https manzil bilan ishlaydi — avval Vercel’ga yuklang");
      await tg("setWebhook", {
        url: `${url}/api/bot`, secret_token: webhookSecret(),
        allowed_updates: ["message", "callback_query"], drop_pending_updates: true,
      });
      const s = await getSettings();
      await tg("setChatMenuButton", { menu_button: { type: "web_app", text: "Do‘kon", web_app: { url } } });
      await tg("setMyCommands", {
        commands: [
          { command: "start", description: "Do‘konni ochish" },
          { command: "joylashuv", description: "Joylashuvni yuborish (manzil uchun)" },
          { command: "id", description: "Chat ID ni bilish (admin uchun)" },
        ],
      });
      await tg("setMyShortDescription", { short_description: `${s.shop_name} — ${s.tagline}`.slice(0, 120) }).catch(() => {});
      const me = await tg<{ username: string }>("getMe", {});
      return NextResponse.json({ ok: true, bot: me.username, url });
    }
    const ids = notifyIds(await getSettings());
    if (!ids.length) throw new Error("Avval “Buyurtmalar keladigan chat ID” ni kiriting");
    for (const chat_id of ids) await tg("sendMessage", { chat_id, text: "✅ Roses: buyurtmalar shu chatga keladi." });
    return NextResponse.json({ ok: true, sent: ids.length });
  } catch (e) {
    return errorJson(e, 400);
  }
}
