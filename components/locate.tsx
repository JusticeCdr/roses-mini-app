"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Check, LocateFixed, MapPin, Settings2 } from "lucide-react";
import { mapLinks } from "@/lib/geo";
import { useShop, type TgLocation } from "./shop-provider";

export type Located = { lat: number; lng: number; address: string | null };
type State = "idle" | "locating" | "done" | "denied" | "error";

/** Telegram LocationManager first (Bot API 8.0), browser geolocation as a fallback. */
export function useLocate() {
  const { tg, api, haptic, t } = useShop();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  const fromBrowser = () =>
    new Promise<TgLocation>((resolve, reject) => {
      if (!("geolocation" in navigator)) return reject(new Error("unsupported"));
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        (e) => reject(new Error(e.code === 1 ? "denied" : "error")),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      );
    });

  const fromTelegram = () =>
    new Promise<TgLocation>((resolve, reject) => {
      const lm = tg?.LocationManager;
      if (!lm || !tg?.isVersionAtLeast?.("8.0")) return reject(new Error("unsupported"));
      const ask = () => {
        if (!lm.isLocationAvailable) return reject(new Error("unsupported"));
        lm.getLocation((d) => {
          if (d) resolve(d);
          else reject(new Error(lm.isAccessRequested && !lm.isAccessGranted ? "denied" : "error"));
        });
      };
      if (lm.isInited) ask();
      else lm.init(ask);
    });

  async function locate(): Promise<Located | null> {
    setState("locating");
    setError(null);
    haptic("tap");
    let pos: TgLocation;
    try {
      pos = await fromTelegram().catch((e: Error) => (e.message === "denied" ? Promise.reject(e) : fromBrowser()));
    } catch (e) {
      const denied = (e as Error).message === "denied";
      setState(denied ? "denied" : "error");
      setError(denied ? t("locDenied") : t("locError"));
      haptic("error");
      return null;
    }
    const lat = pos.latitude, lng = pos.longitude;
    let address: string | null = null;
    try {
      address = (await api<{ address: string | null }>(`/api/geocode?lat=${lat}&lng=${lng}`)).address;
    } catch { /* address stays empty, coordinates are still sent */ }
    setState("done");
    haptic("success");
    if (!address) setError(t("locNoStreet"));
    return { lat, lng, address };
  }

  const openSettings = () => tg?.LocationManager?.openSettings();
  return { state, error, locate, openSettings, canOpenSettings: Boolean(tg?.LocationManager) };
}

export function LocateButton({ coords, onLocated, auto }: { coords?: { lat: number; lng: number } | null; onLocated(l: Located): void; auto?: boolean }) {
  const { state, error, locate, openSettings, canOpenSettings } = useLocate();
  const { t } = useShop();
  const run = async () => {
    const r = await locate();
    if (r) onLocated(r);
  };
  useEffect(() => {
    if (auto) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);
  const has = Boolean(coords);
  const links = coords ? mapLinks(coords.lat, coords.lng) : null;

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={state === "locating"}
        className={clsx(
          "press relative flex min-h-[56px] w-full items-center gap-3 overflow-hidden rounded-[16px] px-4 text-left",
          has ? "bg-accent-soft" : "bg-surface shadow-soft",
        )}
      >
        <span className={clsx("relative grid h-9 w-9 shrink-0 place-items-center rounded-full", has ? "bg-accent text-accent-ink" : "bg-accent-soft text-accent")}>
          {state === "locating" ? <span className="locate-ping absolute inset-0 rounded-full bg-accent/40" aria-hidden /> : null}
          {has && state !== "locating" ? <Check size={18} /> : <LocateFixed size={18} className={state === "locating" ? "animate-spin [animation-duration:2.4s]" : ""} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold">
            {state === "locating" ? t("locating") : has ? t("located") : t("locate")}
          </span>
          <span className="block text-[13px] text-muted">
            {has ? t("locatedHint") : t("locateHint")}
          </span>
        </span>
        {has ? <span className="text-[13px] font-semibold text-accent">{t("update")}</span> : null}
      </button>
      {links ? (
        <a href={links.yandex} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center gap-1 text-[13px] font-semibold text-accent">
          <MapPin size={14} /> {t("onMap")}
        </a>
      ) : null}
      {error ? (
        <p role="alert" className={clsx("mt-2 flex flex-wrap items-center gap-2 text-[14px] font-semibold", state === "done" ? "text-muted" : "text-rose")}>
          {error}
          {state === "denied" && canOpenSettings ? (
            <button type="button" onClick={openSettings} className="inline-flex items-center gap-1 underline"><Settings2 size={14} /> {t("allowAccess")}</button>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
