import { unsplash } from "./format";
import type { Banner, Category, Product, Promo, Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  shop_name: "Roses",
  tagline: "Gul do‘koni",
  phone: "",
  address: "",
  work_hours: "Har kuni 08:00 – 22:00",
  delivery_fee: 30000,
  free_delivery_from: 500000,
  min_order: 0,
  notify_chat_ids: "",
  card_number: "",
  card_holder: "",
  card_bank: "",
  welcome_image: "",
  welcome_text_ru:
    "Здравствуйте! Добро пожаловать в цветочный магазин Roses 🌹\nБукеты, цветы в коробке и подарки — выбирайте и заказывайте прямо здесь.",
  welcome_text:
    "Assalomu alaykum! Roses gul do‘koniga xush kelibsiz 🌹\nBuketlar, qutidagi gullar va sovg‘alarni shu yerning o‘zida tanlab, buyurtma berishingiz mumkin.",
};

const P = {
  pinkClose: "photo-1582794543139-8ac9cb0f7b11",
  pinkWhite: "photo-1523693916903-027d144a2b7d",
  vaseLight: "photo-1758906732463-19d187d67463",
  glassVase: "photo-1572454591674-2739f30d8c40",
  redRose: "photo-1559779080-6970e0186790",
  pinkBud: "photo-1782049912887-4aef70bba9d4",
  wall: "photo-1581938165093-050aeb5ef218",
  redRoses: "photo-1518709779341-56cf4535e94b",
  paperBag: "photo-1615385639736-362b69696227",
  whiteTable: "photo-1608027790251-5e0c80d043d9",
  pinkClose2: "photo-1589458456444-f7158a7e8a4f",
  pinkWhite2: "photo-1605341778220-2652cd6c97c6",
};
const img = (id: string) => unsplash(id, 900, 1125);

const RU: Record<string, [string, string]> = {"p-1": ["Розовое утро", "15 розовых роз и зелень. Упаковка из крафт-бумаги с лентой."], "p-2": ["Белое и розовое", "Лёгкий букет из белых и розовых роз. Открытка в подарок."], "p-3": ["Красные розы · 25 шт", "25 красных роз на длинном стебле. Классика для признания в любви."], "p-4": ["Осень в стеклянной вазе", "Цветы розовых, бежевых и бордовых оттенков в стеклянной вазе. Ваза включена."], "p-5": ["Нежность в белой вазе", "Нежно-розовые розы в белой керамической вазе. Для дома и офиса."], "p-6": ["Цветы в крафт-коробке", "Микс цветов в крафт-коробке. Без воды остаются свежими 3–4 дня."], "p-7": ["Розовые розы · 11 шт", "11 розовых роз. Небольшой, но искренний подарок."], "p-8": ["На белом столе", "Нежный букет из розовых роз и мелких цветов."], "p-9": ["Стена из роз", "51 розовая и белая роза в большой коробке. Подарок, который запомнится."]};

export function seedData() {
  const categories: Category[] = [
    { id: "c-buket", name_ru: "Букеты", name: "Buketlar", image: unsplash(P.pinkWhite, 300, 300), sort: 1, active: true },
    { id: "c-quti", name_ru: "Цветы в коробке", name: "Qutidagi gullar", image: unsplash(P.paperBag, 300, 300), sort: 2, active: true },
    { id: "c-atirgul", name_ru: "Розы", name: "Atirgullar", image: unsplash(P.redRose, 300, 300), sort: 3, active: true },
    { id: "c-vaza", name_ru: "Цветы в вазе", name: "Vazadagi gullar", image: unsplash(P.vaseLight, 300, 300), sort: 4, active: true },
  ];

  const p = (
    id: string, category_id: string, name: string, price: number, photos: string[],
    description: string, extra: Partial<Product> = {},
  ): Product => ({
    id, category_id, name, price, description, images: photos.map(img),
    old_price: null, is_promo: false, is_new: false, in_stock: true, sort: 0,
    name_ru: RU[id]?.[0] ?? "", description_ru: RU[id]?.[1] ?? "", ...extra,
  });

  const products: Product[] = [
    p("p-1", "c-buket", "Pushti tong", 420000, [P.pinkBud, P.pinkClose2],
      "15 ta pushti atirgul va yashil novdalar. Kraft qog‘ozga o‘ralgan, lenta bilan.", { is_new: true, sort: 1 }),
    p("p-2", "c-buket", "Oq va pushti", 380000, [P.pinkWhite, P.pinkWhite2],
      "Oq va pushti atirgullardan yengil buket. Sovg‘a kartochkasi bepul.", { old_price: 450000, is_promo: true, sort: 2 }),
    p("p-3", "c-atirgul", "Qizil atirgul · 25 dona", 650000, [P.redRoses, P.redRose],
      "25 ta uzun poyali qizil atirgul. Sevgi izhori uchun klassika.", { sort: 3 }),
    p("p-4", "c-vaza", "Shisha vazada kuz", 520000, [P.glassVase],
      "Pushti, bej va bordo ranglardagi gullar shisha vazada. Vaza narxga kiradi.", { old_price: 600000, is_promo: true, sort: 4 }),
    p("p-5", "c-vaza", "Oq vazada nafislik", 480000, [P.vaseLight],
      "Och pushti atirgullar oq keramik vazada. Uy va ofis uchun.", { is_new: true, sort: 5 }),
    p("p-6", "c-quti", "Kraft qutida gullar", 350000, [P.paperBag],
      "Kraft qutidagi aralash gullar. Suvsiz 3–4 kun yangi turadi.", { sort: 6 }),
    p("p-7", "c-atirgul", "Pushti atirgul · 11 dona", 290000, [P.pinkClose, P.pinkClose2],
      "11 ta pushti atirgul. Kichik, lekin samimiy sovg‘a.", { old_price: 340000, is_promo: true, sort: 7 }),
    p("p-8", "c-buket", "Oq stol ustida", 440000, [P.whiteTable],
      "Pushti atirgullar va mayda gullardan yumshoq buket.", { sort: 8 }),
    p("p-9", "c-quti", "Atirgul devori", 890000, [P.wall],
      "Katta qutida 51 ta pushti va oq atirgul. Esda qoladigan sovg‘a.", { is_new: true, sort: 9 }),
  ];

  const banners: Banner[] = [
    {
      id: "b-1", title: "Birinchi buyurtmaga −10%", subtitle: "ROSES10 promo-kodi bilan",
      image: unsplash(P.wall, 1200, 720), button_text: "Tanlash",
      title_ru: "Скидка −10% на первый заказ", subtitle_ru: "С промокодом ROSES10", button_text_ru: "Выбрать", link_type: "category", link_value: "c-buket",
      active: true, sort: 1,
    },
    {
      id: "b-2", title: "Vazadagi gullar", subtitle: "Vaza bilan birga yetkazamiz",
      image: unsplash(P.glassVase, 1200, 720), button_text: "Ko‘rish",
      title_ru: "Цветы в вазе", subtitle_ru: "Доставим вместе с вазой", button_text_ru: "Смотреть", link_type: "category", link_value: "c-vaza",
      active: true, sort: 2,
    },
  ];

  const promos: Promo[] = [
    {
      id: "pr-1", code: "ROSES10", title: "Birinchi buyurtmaga 10% chegirma", title_ru: "Скидка 10% на первый заказ", type: "percent", value: 10,
      min_total: 300000, max_uses: null, uses: 0, expires_at: null, active: true, show_on_home: true,
    },
  ];

  return {
    categories, products, banners, promos,
    customers: [], orders: [],
    settings: [{ id: "main", data: DEFAULT_SETTINGS }],
  };
}
