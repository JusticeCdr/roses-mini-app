"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui";
import { FieldInput, type FieldDef } from "./fields";

export async function adminApi<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(path, { ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) }, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error ?? "Xatolik");
  return j as T;
}

type Row = Record<string, unknown> & { id: string };

export function useRows<T extends Row>(entity: string) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => {
    adminApi<{ rows: T[] }>(`/api/admin/${entity}`).then((r) => setRows(r.rows)).catch((e) => setError(e.message));
  }, [entity]);
  useEffect(reload, [reload]);
  return { rows, setRows, error, reload };
}

export function Resource<T extends Row>({
  entity, title, fields, blank, renderRow, addLabel = "Qo‘shish", onChange, searchText,
}: {
  entity: string;
  title: string;
  fields: FieldDef[];
  blank: Partial<T>;
  renderRow(r: T, patch: (p: Partial<T>) => void): React.ReactNode;
  addLabel?: string;
  onChange?(): void;
  searchText?(r: T): string;
}) {
  const { rows, setRows, error, reload } = useRows<T>(entity);
  const [edit, setEdit] = useState<Partial<T> | null>(null);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const patch = (r: T) => async (p: Partial<T>) => {
    setRows((rs) => rs?.map((x) => (x.id === r.id ? { ...x, ...p } : x)) ?? null);
    try {
      await adminApi(`/api/admin/${entity}/${r.id}`, { method: "PUT", body: JSON.stringify(p) });
      setToast("Saqlandi");
      onChange?.();
    } catch (e) {
      setToast((e as Error).message);
      reload();
    }
    setTimeout(() => setToast(null), 1600);
  };
  const shown = (rows ?? []).filter((r) => !q.trim() || (searchText?.(r) ?? "").toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-[30px] leading-none font-semibold">{title}</h2>
        <Button onClick={() => setEdit({ ...blank })} className="!min-h-11 !rounded-full !px-4 !text-[15px]"><Plus size={18} /> {addLabel}</Button>
      </div>
      {searchText && (rows?.length ?? 0) > 4 ? (
        <label className="relative mb-3 block">
          <span className="sr-only">Qidirish</span>
          <Search size={17} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input className="field !min-h-11 !rounded-full !py-2 pl-11" placeholder="Qidirish…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      ) : null}
      {error ? <p className="text-accent">{error}</p> : null}
      {!rows ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-[18px]" />)}</div>
      ) : !rows.length ? (
        <p className="rounded-[18px] bg-surface p-6 text-center text-muted">Hozircha bo‘sh. “{addLabel}” tugmasini bosing.</p>
      ) : (
        <ul className="grid gap-2 lg:grid-cols-2">
          {shown.map((r) => (
            <li key={r.id} className="enter flex items-center gap-3 rounded-[18px] bg-surface p-3 shadow-soft">
              <div className="min-w-0 flex-1">{renderRow(r, patch(r))}</div>
              <button type="button" onClick={() => setEdit(r)} aria-label="Tahrirlash" className="press grid h-11 w-11 shrink-0 place-items-center rounded-full bg-well"><Pencil size={17} /></button>
            </li>
          ))}
        </ul>
      )}
      {toast ? <div role="status" className="fade-in fixed top-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[14px] font-semibold text-white shadow-lg">{toast}</div> : null}
      {edit ? (
        <Editor
          entity={entity}
          fields={fields}
          initial={edit}
          onClose={() => setEdit(null)}
          onSaved={() => { setEdit(null); reload(); onChange?.(); }}
        />
      ) : null}
    </section>
  );
}

function Editor<T extends Row>({ entity, fields, initial, onClose, onSaved }: {
  entity: string; fields: FieldDef[]; initial: Partial<T>; onClose(): void; onSaved(): void;
}) {
  const [v, setV] = useState<Record<string, unknown>>({ ...initial });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isNew = !initial.id;

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await adminApi(isNew ? `/api/admin/${entity}` : `/api/admin/${entity}/${initial.id}`, {
        method: isNew ? "POST" : "PUT", body: JSON.stringify(v),
      });
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!confirm("Rostdan ham o‘chirasizmi? Buni qaytarib bo‘lmaydi.")) return;
    setBusy(true);
    try {
      await adminApi(`/api/admin/${entity}/${initial.id}`, { method: "DELETE" });
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-ink/30 sm:items-center sm:p-6" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={save} className="sheet-in flex max-h-[94dvh] w-full max-w-xl flex-col rounded-t-[28px] bg-bg sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="font-display text-[24px] font-semibold">{isNew ? "Yangi" : "Tahrirlash"}</h3>
          <button type="button" onClick={onClose} aria-label="Yopish" className="press grid h-11 w-11 place-items-center rounded-full"><X size={20} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {fields.map((f) => <FieldInput key={f.key} def={f} value={v[f.key]} onChange={(x) => setV((s) => ({ ...s, [f.key]: x }))} />)}
          {err ? <p role="alert" className="font-semibold text-accent">{err}</p> : null}
        </div>
        <div className="flex gap-2 border-t border-line px-5 pt-3" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
          {!isNew ? (
            <Button type="button" variant="ghost" onClick={remove} disabled={busy} aria-label="O‘chirish" className="!px-4 text-accent"><Trash2 size={18} /></Button>
          ) : null}
          <Button type="submit" className="flex-1" loading={busy}>Saqlash</Button>
        </div>
      </form>
    </div>
  );
}
