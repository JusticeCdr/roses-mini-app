import { NextResponse } from "next/server";
import { errorJson, isAdmin, unauthorized } from "@/lib/admin-auth";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Faqat rasm yuklash mumkin" }, { status: 400 });
    if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "Rasm 4 MB dan kichik bo‘lsin" }, { status: 400 });
    const url = await store().upload(Buffer.from(await file.arrayBuffer()), file.name || "image.jpg", file.type);
    return NextResponse.json({ url });
  } catch (e) {
    return errorJson(e);
  }
}
