"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, Package } from "lucide-react";
import { useShop } from "@/components/shop-provider";
import { Button, Empty, PageHeader } from "@/components/ui";
import { dateTime, money } from "@/lib/format";
import { ORDER_STATUS, type Order, type OrderStatus } from "@/lib/types";

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-accent-soft text-accent",
  accepted: "bg-sage text-ok",
  delivering: "bg-[#f6ecdc] text-warn",
  done: "bg-well text-ink",
  cancelled: "bg-well text-muted",
};

export default function OrdersPage() {
  const { api, inTelegram, meLoaded } = useShop();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!meLoaded) return;
    api<{ orders: Order[] }>("/api/orders").then((r) => setOrders(r.orders)).catch(() => setOrders([]));
  }, [api, meLoaded]);

  return (
    <div>
      <PageHeader title="Buyurtmalar" />
      {!orders ? (
        <div className="space-y-3 px-4">{[0, 1].map((i) => <div key={i} className="skeleton h-28 rounded-[20px]" />)}</div>
      ) : !orders.length ? (
        <Empty
          icon={<Package size={34} />}
          title="Hali buyurtma yo‘q"
          text={inTelegram ? "Birinchi buketingizni tanlang — buyurtmalar shu yerda ko‘rinadi." : "Buyurtmalaringizni ko‘rish uchun do‘konni Telegram bot orqali oching."}
          action={<Link href="/catalog"><Button>Gul tanlash</Button></Link>}
        />
      ) : (
        <ul className="space-y-3 px-4">
          {orders.map((o) => {
            const expanded = open === o.id;
            return (
              <li key={o.id} className="rounded-[22px] bg-surface shadow-soft">
                <button type="button" onClick={() => setOpen(expanded ? null : o.id)} aria-expanded={expanded} className="press w-full p-4 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[16px] font-bold">#{o.number}</span>
                    <span className={clsx("rounded-full px-3 py-1 text-[13px] font-bold", STATUS_STYLE[o.status])}>{ORDER_STATUS[o.status]}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">{dateTime(o.created_at)}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-3">
                      {o.items.slice(0, 4).map((i) => (
                        <span key={i.product_id} className="block h-12 w-12 overflow-hidden rounded-full border-2 border-surface bg-well">
                          {i.image ? <img src={i.image} alt="" className="h-full w-full object-cover" /> : null}
                        </span>
                      ))}
                    </div>
                    <span className="ml-auto text-[16px] font-bold tabular-nums">{money(o.total)}</span>
                    <ChevronDown size={18} className={clsx("text-muted transition-transform", expanded && "rotate-180")} aria-hidden />
                  </div>
                </button>
                {expanded ? (
                  <div className="fade-in space-y-2 border-t border-line px-4 pt-3 pb-4 text-[15px]">
                    {o.items.map((i) => (
                      <div key={i.product_id} className="flex justify-between gap-3">
                        <span>{i.name} × {i.qty}</span>
                        <span className="shrink-0 tabular-nums">{money(i.price * i.qty)}</span>
                      </div>
                    ))}
                    {o.discount ? <div className="flex justify-between text-muted"><span>Chegirma</span><span>−{money(o.discount)}</span></div> : null}
                    <div className="flex justify-between text-muted"><span>Yetkazib berish</span><span>{o.delivery_fee ? money(o.delivery_fee) : "Bepul"}</span></div>
                    <p className="pt-2 text-muted">{o.address} · {o.delivery_time}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
