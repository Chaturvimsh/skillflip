import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { Image } from "@/components/ui/image";
import Deliverables from "@/components/orders/Deliverables";
import OrderActions from "@/components/orders/OrderActions";
import { ORDER_FLOW } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function OrderCard({ order, role, onUpdate, onMessage, onApprove, onRefresh, busy }) {
  const status = ORDER_FLOW[order.status] ?? ORDER_FLOW.requested;
  const counterpart = role === "seller" ? order.buyer_name : order.seller_name;
  const counterpartUsername = role === "seller" ? order.buyer_username : order.seller_username;

  return (
    <article className="flex items-start gap-3 rounded-[24px] border border-border/80 bg-card p-4 sm:gap-4 sm:rounded-[26px]">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-secondary sm:h-20 sm:w-20">
        {order.service_image ? (
          <Image src={order.service_image} alt={order.service_title} fittingType="fill" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center font-display text-lg font-bold text-foreground/40">
            {order.service_title?.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold">{order.service_title}</h3>
            <p className="text-[12px] text-muted-foreground">
              {role === "seller" ? "from" : "with"}{" "}
              {counterpartUsername ? (
                <Link to="/u/$username" params={{ username: counterpartUsername }} className="font-medium hover:underline">
                  {counterpart}
                </Link>
              ) : (
                counterpart
              )}
            </p>
          </div>
          <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]", status.tone)}>
            {status.label}
          </span>
        </div>

        {order.notes && <p className="line-clamp-2 rounded-xl bg-secondary/70 px-3 py-2 text-[12px] text-foreground/75">{order.notes}</p>}

        <Deliverables order={order} />

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="font-display text-sm font-bold text-foreground">{formatINR(order.price)}</span>
          {order.due_date && (
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" /> due {formatDate(order.due_date)}
            </span>
          )}
        </div>

        <OrderActions
          order={order}
          role={role}
          busy={busy}
          onUpdate={onUpdate}
          onMessage={onMessage}
          onApprove={onApprove}
          onRefresh={onRefresh}
        />
      </div>
    </article>
  );
}