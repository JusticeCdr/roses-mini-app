export function money(n: number): string {
  const s = String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${s} so‘m`;
}

export function discountPercent(price: number, old: number | null): number | null {
  if (!old || old <= price) return null;
  return Math.round(((old - price) / old) * 100);
}

export function dateTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const months = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()}-${months[d.getMonth()]}, ${hh}:${mm}`;
}

/** Unsplash crop helper for seed photos. */
export function unsplash(id: string, w = 800, h?: number): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ""}&q=80`;
}

export function formatCard(n: string): string {
  return n.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}
