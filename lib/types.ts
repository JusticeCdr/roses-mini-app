export type Category = {
  id: string;
  name: string;
  image: string | null;
  sort: number;
  active: boolean;
  created_at?: string;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  old_price: number | null;
  images: string[];
  is_promo: boolean;
  is_new: boolean;
  in_stock: boolean;
  sort: number;
  created_at?: string;
};

export type LinkType = "none" | "category" | "product" | "url";

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  button_text: string;
  link_type: LinkType;
  link_value: string;
  active: boolean;
  sort: number;
  created_at?: string;
};

export type Promo = {
  id: string;
  code: string;
  title: string;
  type: "percent" | "fixed";
  value: number;
  min_total: number;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  active: boolean;
  show_on_home: boolean;
  created_at?: string;
};

export type Customer = {
  id: string; // Telegram user id
  first_name: string;
  last_name: string;
  username: string;
  name: string;
  phone: string;
  address: string;
  created_at?: string;
  updated_at?: string;
};

export type OrderItem = {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  image: string | null;
};

export type OrderStatus = "new" | "accepted" | "delivering" | "done" | "cancelled";

export type Order = {
  id: string;
  number: number;
  customer_id: string;
  tg_username: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  promo_code: string | null;
  name: string;
  phone: string;
  address: string;
  delivery_time: string;
  comment: string;
  payment: string;
  status: OrderStatus;
  created_at?: string;
};

export type Settings = {
  shop_name: string;
  tagline: string;
  phone: string;
  address: string;
  work_hours: string;
  delivery_fee: number;
  free_delivery_from: number;
  min_order: number;
  notify_chat_ids: string;
  welcome_text: string;
};

export type PublicPromo = Pick<Promo, "code" | "title" | "type" | "value" | "min_total">;

export type Catalog = {
  settings: Settings;
  categories: Category[];
  products: Product[];
  banners: Banner[];
  promos: PublicPromo[];
};

export const ORDER_STATUS: Record<OrderStatus, string> = {
  new: "Yangi",
  accepted: "Qabul qilindi",
  delivering: "Yo‘lda",
  done: "Yetkazildi",
  cancelled: "Bekor qilindi",
};
