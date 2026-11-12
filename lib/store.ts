import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { seedData } from "./seed";

export type Table = "categories" | "products" | "banners" | "promos" | "customers" | "orders" | "settings";
type Row = Record<string, unknown> & { id: string };
type ListOpts = {
  where?: Record<string, string | number | boolean>;
  order?: [string, "asc" | "desc"][];
  limit?: number;
};

export interface Store {
  kind: "supabase" | "local";
  list<T>(t: Table, opts?: ListOpts): Promise<T[]>;
  get<T>(t: Table, id: string): Promise<T | null>;
  insert<T>(t: Table, row: Row): Promise<T>;
  update<T>(t: Table, id: string, patch: Record<string, unknown>): Promise<T>;
  upsert<T>(t: Table, row: Row): Promise<T>;
  remove(t: Table, id: string): Promise<void>;
  count(t: Table): Promise<number>;
  upload(file: Buffer, name: string, contentType: string): Promise<string>;
}

const PREFIX = "roses_";

/* ---------------- Supabase (production) ---------------- */

function supabaseStore(sb: SupabaseClient): Store {
  const tbl = (t: Table) => sb.from(PREFIX + t);
  const fail = (e: { message: string } | null) => {
    if (e) throw new Error(e.message);
  };
  return {
    kind: "supabase",
    async list<T>(t: Table, opts: ListOpts = {}) {
      let q = tbl(t).select("*");
      for (const [k, v] of Object.entries(opts.where ?? {})) q = q.eq(k, v);
      for (const [col, dir] of opts.order ?? []) q = q.order(col, { ascending: dir === "asc" });
      if (opts.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      fail(error);
      return (data ?? []) as T[];
    },
    async get<T>(t: Table, id: string) {
      const { data, error } = await tbl(t).select("*").eq("id", id).maybeSingle();
      fail(error);
      return (data as T) ?? null;
    },
    async insert<T>(t: Table, row: Row) {
      const { data, error } = await tbl(t).insert(row).select().single();
      fail(error);
      return data as T;
    },
    async update<T>(t: Table, id: string, patch: Record<string, unknown>) {
      const { data, error } = await tbl(t).update(patch).eq("id", id).select().single();
      fail(error);
      return data as T;
    },
    async upsert<T>(t: Table, row: Row) {
      const { data, error } = await tbl(t).upsert(row).select().single();
      fail(error);
      return data as T;
    },
    async remove(t: Table, id: string) {
      const { error } = await tbl(t).delete().eq("id", id);
      fail(error);
    },
    async count(t: Table) {
      const { count, error } = await tbl(t).select("id", { count: "exact", head: true });
      fail(error);
      return count ?? 0;
    },
    async upload(file, name, contentType) {
      const key = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}-${name.replace(/[^a-z0-9.]+/gi, "-").slice(-40)}`;
      const { error } = await sb.storage.from("roses").upload(key, file, { contentType, upsert: false });
      fail(error);
      return sb.storage.from("roses").getPublicUrl(key).data.publicUrl;
    },
  };
}

/* ---------------- Local JSON file (demo / development) ---------------- */

type Db = Record<Table, Row[]>;

function localStore(): Store {
  const file = process.env.DATA_FILE || (process.env.VERCEL ? "/tmp/roses-db.json" : path.join(process.cwd(), ".data", "db.json"));
  let cache: Db | null = null;

  async function load(): Promise<Db> {
    if (cache) return cache;
    try {
      cache = JSON.parse(await fs.readFile(file, "utf8")) as Db;
    } catch {
      cache = seedData() as unknown as Db;
      await save();
    }
    return cache!;
  }
  async function save() {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(cache, null, 2));
  }
  const sorter = (order: ListOpts["order"] = []) => (a: Row, b: Row) => {
    for (const [col, dir] of order) {
      const x = a[col] as string | number, y = b[col] as string | number;
      if (x === y) continue;
      const r = x > y ? 1 : -1;
      return dir === "asc" ? r : -r;
    }
    return 0;
  };
  const now = () => new Date().toISOString();

  return {
    kind: "local",
    async list<T>(t: Table, opts: ListOpts = {}) {
      const db = await load();
      let rows = [...(db[t] ?? [])];
      for (const [k, v] of Object.entries(opts.where ?? {})) rows = rows.filter((r) => r[k] === v);
      rows.sort(sorter(opts.order));
      if (opts.limit) rows = rows.slice(0, opts.limit);
      return structuredClone(rows) as unknown as T[];
    },
    async get<T>(t: Table, id: string) {
      const db = await load();
      const r = (db[t] ?? []).find((x) => x.id === id);
      return r ? (structuredClone(r) as unknown as T) : null;
    },
    async insert<T>(t: Table, row: Row) {
      const db = await load();
      const r = { created_at: now(), ...row };
      (db[t] ??= []).push(r);
      await save();
      return structuredClone(r) as unknown as T;
    },
    async update<T>(t: Table, id: string, patch: Record<string, unknown>) {
      const db = await load();
      const r = (db[t] ?? []).find((x) => x.id === id);
      if (!r) throw new Error("Topilmadi");
      Object.assign(r, patch);
      await save();
      return structuredClone(r) as unknown as T;
    },
    async upsert<T>(t: Table, row: Row) {
      const db = await load();
      const r = (db[t] ??= []).find((x) => x.id === row.id);
      if (r) Object.assign(r, row);
      else db[t].push({ created_at: now(), ...row });
      await save();
      return structuredClone(r ?? row) as unknown as T;
    },
    async remove(t: Table, id: string) {
      const db = await load();
      db[t] = (db[t] ?? []).filter((x) => x.id !== id);
      await save();
    },
    async count(t: Table) {
      return ((await load())[t] ?? []).length;
    },
    async upload(file, name) {
      if (process.env.VERCEL) throw new Error("Rasm yuklash uchun Supabase ulang (yoki rasm havolasini kiriting).");
      const dir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(dir, { recursive: true });
      const fname = `${crypto.randomUUID()}-${name.replace(/[^a-z0-9.]+/gi, "-").slice(-40)}`;
      await fs.writeFile(path.join(dir, fname), file);
      return `/uploads/${fname}`;
    },
  };
}

let instance: Store | null = null;

export function store(): Store {
  if (instance) return instance;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  instance = url && key
    ? supabaseStore(createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }))
    : localStore();
  return instance;
}
