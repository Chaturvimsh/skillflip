import { useState } from "react";
import { MessageCircle, Upload } from "lucide-react";
import DeliveryDialog from "@/components/orders/DeliveryDialog";
import RevisionDialog from "@/components/orders/RevisionDialog";
import { cn } from "@/lib/utils";

export default function OrderActions({ order, role, busy, onUpdate, onMessage, onApprove, onRefresh }) {
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const actions = [];

  if (role === "seller" && order.status === "requested") {
    actions.push({ label: "Accept", onClick: () => onUpdate(order.id, "in_progress"), primary: true });
    actions.push({ label: "Decline", onClick: () => onUpdate(order.id, "declined") });
  }

  if (role === "seller" && ["in_progress", "delivered"].includes(order.status)) {
    actions.push({
      label: order.status === "delivered" ? "Replace delivery" : "Upload & deliver",
      onClick: () => setDeliveryOpen(true),
      primary: order.status === "in_progress",
      icon: Upload,
    });
  }

  if (role === "buyer" && order.status === "delivered") {
    actions.push({ label: "Approve & complete", onClick: () => onApprove(order.id), primary: true });
    actions.push({ label: "Request changes", onClick: () => setRevisionOpen(true) });
  }

  if (role === "buyer" && order.status === "requested") {
    actions.push({ label: "Cancel request", onClick: () => onUpdate(order.id, "declined") });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              disabled={busy}
              onClick={action.onClick}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-50 sm:py-1.5",
                action.primary ? "bg-foreground text-background" : "border border-foreground/15",
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {action.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onMessage(order)}
          className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-4 py-2.5 text-[12px] font-semibold sm:ml-auto sm:py-1.5"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Message
        </button>
      </div>

      <DeliveryDialog order={order} open={deliveryOpen} onOpenChange={setDeliveryOpen} onDone={onRefresh} />
      <RevisionDialog order={order} open={revisionOpen} onOpenChange={setRevisionOpen} onDone={onRefresh} />
    </>
  );
}