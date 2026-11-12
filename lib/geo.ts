export function validCoords(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const a = Number(lat), b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a < -90 || a > 90 || b < -180 || b > 180) return null;
  if (a === 0 && b === 0) return null;
  return { lat: Math.round(a * 1e6) / 1e6, lng: Math.round(b * 1e6) / 1e6 };
}

export function mapLinks(lat: number, lng: number) {
  return {
    yandex: `https://yandex.uz/maps/?pt=${lng},${lat}&z=17&l=map`,
    google: `https://maps.google.com/?q=${lat},${lng}`,
  };
}

type NominatimAddress = Record<string, string | undefined>;

/** Turns a Nominatim address into a short, courier-friendly line. */
export function formatAddress(a: NominatimAddress, fallback = ""): string {
  const street = [a.road ?? a.pedestrian ?? a.footway, a.house_number].filter(Boolean).join(" ");
  const parts = [
    street,
    a.neighbourhood ?? a.quarter ?? a.residential,
    a.suburb ?? a.city_district ?? a.county,
    a.city ?? a.town ?? a.village,
  ].filter((x): x is string => Boolean(x && x.trim()));
  const unique = parts.filter((p, i) => parts.findIndex((q) => q.toLowerCase() === p.toLowerCase()) === i);
  return unique.join(", ") || fallback;
}

/** Reverse geocoding via OpenStreetMap Nominatim (free, ~1 req/s). */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=uz,ru`;
    const r = await fetch(url, {
      headers: { "user-agent": "RosesFlowerShop/1.0 (Telegram Mini App)", accept: "application/json" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { address?: NominatimAddress; display_name?: string };
    const short = j.display_name?.split(",").slice(0, 4).join(",").trim() ?? "";
    return formatAddress(j.address ?? {}, short) || null;
  } catch {
    return null;
  }
}
