"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, X } from "lucide-react";

export type FieldDef =
  | { key: string; label: string; type: "text" | "textarea" | "number" | "date"; hint?: string; placeholder?: string; required?: boolean }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; hint?: string }
  | { key: string; label: string; type: "bool"; hint?: string }
  | { key: string; label: string; type: "image" | "images"; hint?: string; aspect?: string };

/** Shrinks photos in the browser before upload (keeps uploads fast and under Vercel limits). */
async function shrink(file: File, max = 1600): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b ?? file), "image/jpeg", 0.86));
}

export async function uploadImage(file: File): Promise<string> {
  const blob = await shrink(file);
  const fd = new FormData();
  fd.append("file", blob, file.name.replace(/\.\w+$/, "") + ".jpg");
  const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? "Yuklab bo‘lmadi");
  return j.url as string;
}

export function FieldInput({ def, value, onChange }: { def: FieldDef; value: unknown; onChange(v: unknown): void }) {
  const label = <span className="mb-1.5 block text-[13px] font-semibold text-muted">{def.label}</span>;
  const hint = def.hint ? <span className="mt-1.5 block text-[13px] text-muted">{def.hint}</span> : null;

  switch (def.type) {
    case "text":
    case "number":
      return (
        <label className="block">
          {label}
          <input
            className="field"
            type={def.type === "number" ? "number" : "text"}
            inputMode={def.type === "number" ? "numeric" : undefined}
            value={value == null ? "" : String(value)}
            placeholder={def.placeholder}
            required={def.required}
            onChange={(e) => onChange(def.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
          />
          {hint}
        </label>
      );
    case "date":
      return (
        <label className="block">
          {label}
          <input className="field" type="date" value={value ? String(value).slice(0, 10) : ""} onChange={(e) => onChange(e.target.value || null)} />
          {hint}
        </label>
      );
    case "textarea":
      return (
        <label className="block">
          {label}
          <textarea className="field min-h-[110px]" rows={4} value={String(value ?? "")} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />
          {hint}
        </label>
      );
    case "select":
      return (
        <label className="block">
          {label}
          <select className="field" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            {def.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {hint}
        </label>
      );
    case "bool":
      return (
        <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-4 rounded-[14px] border border-line bg-surface px-4">
          <span>
            <span className="block text-[15px] font-semibold">{def.label}</span>
            {def.hint ? <span className="block text-[13px] text-muted">{def.hint}</span> : null}
          </span>
          <input type="checkbox" className="peer sr-only" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span aria-hidden className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-ok after:absolute after:top-0.5 after:left-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-accent" />
        </label>
      );
    case "image":
    case "images":
      return <ImagesInput def={def} multiple={def.type === "images"} value={value} onChange={onChange} />;
  }
}

function ImagesInput({ def, multiple, value, onChange }: { def: FieldDef; multiple: boolean; value: unknown; onChange(v: unknown): void }) {
  const list: string[] = multiple ? ((value as string[]) ?? []) : value ? [String(value)] : [];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const set = (l: string[]) => onChange(multiple ? l : l[0] ?? "");

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setErr(null);
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, multiple ? 10 : 1)) urls.push(await uploadImage(f));
      set(multiple ? [...list, ...urls].slice(0, 10) : urls);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }
  const move = (i: number, d: number) => {
    const l = [...list];
    const j = i + d;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]];
    set(l);
  };

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold text-muted">{def.label}</span>
      <div className="flex flex-wrap gap-2">
        {list.map((src, i) => (
          <div key={src + i} className={clsx("relative overflow-hidden rounded-2xl bg-well", multiple ? "h-28 w-24" : "h-36 w-full max-w-sm")}>
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => set(list.filter((_, k) => k !== i))} aria-label="Rasmni o‘chirish" className="absolute top-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink"><X size={16} /></button>
            {multiple && list.length > 1 ? (
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <button type="button" onClick={() => move(i, -1)} aria-label="Chapga" className="grid h-7 w-7 place-items-center rounded-full bg-white/90"><ArrowLeft size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} aria-label="O‘ngga" className="grid h-7 w-7 place-items-center rounded-full bg-white/90"><ArrowRight size={14} /></button>
              </div>
            ) : null}
            {multiple && i === 0 ? <span className="absolute top-1 left-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold">Asosiy</span> : null}
          </div>
        ))}
        {(multiple || !list.length) && (
          <button
            type="button"
            onClick={() => file.current?.click()}
            disabled={busy}
            className={clsx("press grid place-items-center rounded-2xl border-2 border-dashed border-line bg-surface text-muted", multiple ? "h-28 w-24" : "h-36 w-full max-w-sm")}
          >
            {busy ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <span className="flex flex-col items-center gap-1 text-[13px] font-semibold"><ImagePlus size={22} /> Rasm yuklash</span>}
          </button>
        )}
      </div>
      <input ref={file} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => pick(e.target.files)} />
      <div className="mt-2 flex gap-2">
        <div className="relative flex-1">
          <Link2 size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input className="field !min-h-11 !py-2 pl-9 text-[14px]" placeholder="yoki rasm havolasini qo‘ying" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <button
          type="button"
          className="press min-h-11 rounded-[14px] border border-line bg-surface px-4 text-[14px] font-semibold"
          onClick={() => { if (/^https?:\/\//.test(url) || url.startsWith("/")) { set(multiple ? [...list, url] : [url]); setUrl(""); } }}
        >
          Qo‘shish
        </button>
      </div>
      {err ? <p className="mt-2 text-[14px] font-semibold text-accent">{err}</p> : null}
      <p className="mt-1.5 text-[13px] text-muted">{def.hint ? `${def.hint} ` : ""}Rasmlar avtomatik WebP formatiga o‘tkaziladi.</p>
    </div>
  );
}
