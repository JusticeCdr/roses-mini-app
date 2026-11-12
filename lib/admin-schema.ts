import type { Table } from "./store";

type Kind = "str" | "text" | "int" | "intn" | "bool" | "strs" | "date" | "code" | "enum";
type Field = { k: Kind; values?: string[] };

export const ENTITIES: Partial<Record<Table, Record<string, Field>>> = {
  categories: { name: { k: "str" }, image: { k: "str" }, sort: { k: "int" }, active: { k: "bool" } },
  products: {
    category_id: { k: "str" }, name: { k: "str" }, description: { k: "text" }, price: { k: "int" },
    old_price: { k: "intn" }, images: { k: "strs" }, is_promo: { k: "bool" }, is_new: { k: "bool" },
    in_stock: { k: "bool" }, sort: { k: "int" },
  },
  banners: {
    title: { k: "str" }, subtitle: { k: "str" }, image: { k: "str" }, button_text: { k: "str" },
    link_type: { k: "enum", values: ["none", "category", "product", "url"] }, link_value: { k: "str" },
    active: { k: "bool" }, sort: { k: "int" },
  },
  promos: {
    code: { k: "code" }, title: { k: "str" }, type: { k: "enum", values: ["percent", "fixed"] },
    value: { k: "int" }, min_total: { k: "int" }, max_uses: { k: "intn" }, expires_at: { k: "date" },
    active: { k: "bool" }, show_on_home: { k: "bool" },
  },
  orders: {
    status: { k: "enum", values: ["new", "accepted", "delivering", "done", "cancelled"] },
  },
};

export const READ_ONLY: Table[] = ["customers"];

const DEFAULTS: Record<Kind, unknown> = {
  str: "", text: "", int: 0, intn: null, bool: false, strs: [], date: null, code: "", enum: "",
};

export function clean(t: Table, body: Record<string, unknown>, partial: boolean): Record<string, unknown> {
  const schema = ENTITIES[t];
  if (!schema) throw new Error("Noma’lum bo‘lim");
  const out: Record<string, unknown> = {};
  for (const [key, f] of Object.entries(schema)) {
    if (!(key in body)) {
      if (!partial) out[key] = f.k === "enum" ? f.values![0] : DEFAULTS[f.k];
      continue;
    }
    const v = body[key];
    switch (f.k) {
      case "str": out[key] = v == null ? "" : String(v).trim().slice(0, 500); break;
      case "text": out[key] = v == null ? "" : String(v).slice(0, 4000); break;
      case "code": out[key] = String(v ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 32); break;
      case "int": out[key] = Math.max(0, Math.round(Number(v) || 0)); break;
      case "intn": out[key] = v === "" || v == null || Number(v) <= 0 ? null : Math.round(Number(v)); break;
      case "bool": out[key] = v === true || v === "true" || v === 1; break;
      case "strs": out[key] = Array.isArray(v) ? v.map(String).filter(Boolean).slice(0, 10) : []; break;
      case "date": out[key] = v ? new Date(String(v)).toISOString() : null; break;
      case "enum": out[key] = f.values!.includes(String(v)) ? String(v) : f.values![0]; break;
    }
  }
  if (t === "categories" && "category_id" in out && !out.category_id) out.category_id = null;
  if (t === "products" && out.category_id === "") out.category_id = null;
  if (!partial) {
    if ((t === "categories" || t === "products") && !out.name) throw new Error("Nomini kiriting");
    if (t === "promos" && !out.code) throw new Error("Promo-kodni kiriting");
  }
  return out;
}
