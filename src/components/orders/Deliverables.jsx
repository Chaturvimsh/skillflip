import { useState } from "react";
import { CheckCircle2, Download, FileText, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { formatDate, relativeTime } from "@/lib/format";
import { getDeliverableUrl } from "@/lib/order-fns";

export default function Deliverables({ order }) {
  const [opening, setOpening] = useState("");
  const files = order.deliverables ?? [];
  const hasDelivery = files.length > 0 || order.delivery_message;

  if (!hasDelivery && !order.revision_note && !order.approved_at) return null;

  const open = async (file) => {
    setOpening(file.file_uri);
    try {
      const { signed_url } = await getDeliverableUrl({ data: { orderId: order.id, fileUri: file.file_uri } });
      window.open(signed_url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Couldn't open that file.");
    } finally {
      setOpening("");
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-secondary/40 p-3">
      {hasDelivery && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Delivery</p>
          {order.delivered_at && (
            <p className="text-[11px] text-muted-foreground">delivered {relativeTime(order.delivered_at)}</p>
          )}
        </div>
      )}

      {order.delivery_message && (
        <p className="whitespace-pre-line text-[12px] leading-relaxed text-foreground/80">{order.delivery_message}</p>
      )}

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file) => (
            <li key={file.file_uri}>
              <button
                type="button"
                onClick={() => open(file)}
                disabled={opening === file.file_uri}
                className="flex w-full items-center gap-2 rounded-xl bg-background px-3 py-2.5 text-left transition-colors hover:bg-card disabled:opacity-60"
              >
                {opening === file.file_uri ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{file.file_name}</span>
                <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {order.revision_note && order.status !== "completed" && (
        <p className="flex items-start gap-1.5 rounded-lg bg-sun/25 px-2.5 py-2 text-[11px] leading-relaxed text-foreground/80">
          <RotateCcw className="mt-0.5 h-3 w-3 shrink-0" /> Changes asked: {order.revision_note}
        </p>
      )}

      {order.approved_at && (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/70">
          <CheckCircle2 className="h-3.5 w-3.5 text-mint" /> Approved {formatDate(order.approved_at)}
        </p>
      )}
    </div>
  );
}