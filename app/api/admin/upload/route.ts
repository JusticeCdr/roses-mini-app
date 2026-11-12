import { NextResponse } from "next/server";
import { errorJson, isAdmin, unauthorized } from "@/lib/admin-auth";
import { store } from "@/lib/store";
import { toWebp } from "@/lib/image";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Faqat rasm yuklash mumkin" }, { status: 400 });
    if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "Rasm 4 MB dan kichik bo‘lsin" }, { status: 400 });
    let webp;
    try {
      webp = await toWebp(Buffer.from(await file.arrayBuffer()));
    } catch {
      return NextResponse.json({ error: "Rasmni o‘qib bo‘lmadi — boshqa fayl tanlang" }, { status: 400 });
    }
    const base = (file.name || "rasm").replace(/\.[a-z0-9]+$/i, "");
    const url = await store().upload(webp.data, `${base}.webp`, "image/webp");
    return NextResponse.json({ url, size: webp.data.length, width: webp.width, height: webp.height, format: "webp" });
  } catch (e) {
    return errorJson(e);
  }
}
