"use client";

import { useEffect, useState } from "react";
import { useShop } from "./shop-provider";

export type QuoteResult = {
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  promo: { code: string; title: string } | null;
  promoError: string | null;
  available: string[];
};

/** Server-side price check for the cart (prices + promo come from the database). */
export function useQuote() {
  const { cart, promo, api, lang } = useShop();
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify([cart, promo, lang]);

  useEffect(() => {
    if (!cart.length) {
      setQuote(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api<QuoteResult>("/api/quote", { method: "POST", body: JSON.stringify({ items: cart, promo }) })
        .then(setQuote)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { quote, loading };
}
