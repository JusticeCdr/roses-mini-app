import { NextResponse } from "next/server";
import { errorJson, isAdmin, unauthorized } from "@/lib/admin-auth";
import { getSettings, notifyIds } from "@/lib/data";
import { appUrl, setupBot, tg } from "@/lib/telegram";

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const { action } = (await req.json()) as { action: "setup" | "test" };
    const url = appUrl(req);
    if (action === "setup") return NextResponse.json({ ok: true, ...(await setupBot(url)) });
    const ids = notifyIds(await getSettings());
    if (!ids.length) throw new Error("Avval “Buyurtmalar keladigan chat ID” ni kiriting");
    for (const chat_id of ids) await tg("sendMessage", { chat_id, text: "✅ Roses: buyurtmalar shu chatga keladi." });
    return NextResponse.json({ ok: true, sent: ids.length });
  } catch (e) {
    return errorJson(e, 400);
  }
}
