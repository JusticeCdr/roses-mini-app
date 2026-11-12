# Roses — gul do‘koni uchun Telegram Mini App

Next.js 16 + Tailwind 4 + Supabase. Mijoz qismi (`/`), admin panel (`/admin`) va Telegram bot (`/api/bot`) bitta loyihada.

## Nimalar bor

**Mijoz uchun (Telegram ichida):**
- bannerlar, promo-kod kartochkasi, kategoriyalar, aksiyadagi gullar, katalog, qidiruv va saralash
- mahsulot sahifasi: bir nechta rasm, chegirma foizi, o‘xshash gullar
- savatcha va promo-kod (narx har doim serverda hisoblanadi)
- birinchi kirishda ro‘yxatdan o‘tish: ism, telefon (Telegram raqamini bir tugma bilan yuborish), manzil
- rasmiylashtirish: yetkazish vaqti, to‘lov usuli, izoh
- “Buyurtmalarim” — holatlari bilan

**Do‘kon egasi uchun:**
- har bir yangi buyurtma **botdan faqat egasining chatiga** keladi, ostida tugmalar bilan: Qabul qilish / Yo‘lda / Yetkazildi / Bekor qilish
- holat o‘zgarganda mijozga bot avtomatik xabar yuboradi
- `/admin`: mahsulotlar (rasm yuklash, narx, eski narx, aksiya, sotuvda bor/yo‘q), kategoriyalar, bannerlar, promo-kodlar (foiz yoki summa, muddat, limit, bosh sahifada ko‘rsatish), buyurtmalar, mijozlar, sozlamalar

## Hozirgi holat
- GitHub: `JusticeCdr/roses-mini-app` (private) — `main` ga har bir push Vercel’da avtomatik yangilanadi.
- Vercel loyihasi: `roses-shop`.
- Supabase: `roses_*` jadvallari va `roses` rasm bucket’i yaratilgan, namuna gullar qo‘shilgan.
- Qolgan 2 qadam: Vercel’ga `BOT_TOKEN` va `SUPABASE_SERVICE_ROLE_KEY` qo‘shish (pastda).

## Ishga tushirish (5 qadam)

### 1. Bot yaratish
@BotFather → `/newbot` → nom bering → **token**ni saqlang.

### 2. Supabase
1. supabase.com → loyiha oching (bor loyihadan ham foydalansa bo‘ladi: jadvallar `roses_` bilan boshlanadi).
2. **SQL Editor** → `supabase/schema.sql` faylini to‘liq qo‘yib **Run** bosing.
3. **Project Settings → API**: `Project URL` va `service_role` kalitini oling.

### 3. Vercel
GitHub’ga yuklang → Vercel → **Add New Project** → shu repo. **Environment Variables**:

| Nomi | Qiymati |
|---|---|
| `BOT_TOKEN` | BotFather bergan token |
| `ADMIN_PASSWORD` | admin panel paroli |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role kaliti (maxfiy!) |

**Deploy** bosing. Manzil chiqadi, masalan `https://roses-shop.vercel.app`.

### 4. Botni ulash
1. `https://...vercel.app/admin` → parol bilan kiring.
2. **Sozlamalar → Namunalarni qo‘shish** (ixtiyoriy, demo gullar) — keyin o‘zingizniki bilan almashtirasiz.
3. Do‘kon egasi botga `/id` yozadi → bot chat ID’ni aytadi → uni **“Buyurtmalar keladigan chat ID”** maydoniga yozib **Saqlash**.
4. **Botni ulash** tugmasini bosing — webhook, `/start` tugmasi va pastdagi menyu tugmasi avtomatik sozlanadi.
5. **Sinov xabari** — ega chatiga xabar kelsa, hammasi tayyor.

### 5. Telegram’da tekshirish
Botga `/start` → “🌹 Do‘konni ochish” → Mini App ochiladi.

Ixtiyoriy: BotFather → `/newapp` orqali to‘g‘ridan-to‘g‘ri havola (`t.me/BotNomi/shop`) ham qilish mumkin — URL sifatida Vercel manzilini bering.

## Lokal ishga tushirish

```bash
npm install
npm run dev
```
Supabase ulanmagan bo‘lsa, ma’lumotlar `.data/db.json` faylida saqlanadi (demo gullar bilan). Admin paroli lokal’da: `admin123`.

## Xavfsizlik
- Mijoz kimligi Telegram imzosi (`initData`, HMAC) orqali serverda tekshiriladi — boshqa birovning nomidan buyurtma berib bo‘lmaydi.
- Narx, chegirma va yetkazish narxi faqat serverda bazadagi narxlardan hisoblanadi.
- Bot webhook’i maxfiy token bilan himoyalangan; buyurtma holatini faqat ega chatlaridagi tugmalar o‘zgartira oladi.
- Supabase jadvallarida RLS yoqilgan — ma’lumotlarni faqat server o‘qiydi.

Namuna rasmlar Unsplash’dan olingan (vaqtinchalik) — admin paneldan do‘konning haqiqiy rasmlariga almashtiring.
