"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "./shop-provider";

/** Adds "Settings" to the Mini App's ⋮ menu in Telegram — opens the profile (address & location). */
export function TelegramMenus() {
  const { tg } = useShop();
  const router = useRouter();
  useEffect(() => {
    const sb = tg?.SettingsButton;
    if (!sb || !tg?.isVersionAtLeast?.("7.0")) return;
    const open = () => router.push("/profile?locate=1");
    sb.onClick(open);
    sb.show();
    return () => { sb.offClick(open); sb.hide(); };
  }, [tg, router]);
  return null;
}
