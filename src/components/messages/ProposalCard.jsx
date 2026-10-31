import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS = {
  pending: { label: "Awaiting reply", tone: "bg-accent text-accent-foreground" },
  accepted: { label: "Accepted", tone: "bg-mint text-foreground" },
  rejected: { label: "Declined", tone: "bg-muted text-muted-foreground" },
};

export default function ProposalCard({ proposal, me, busy, onAccept, onReject }) {
  const isBuyer = proposal.buyer_id === me?.id;
  const status = STATUS[proposal.status] ?? STATUS.pending;

  return (
    <div className="w-full rounded-[22px] border border-border/80 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/60">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Proposal
        </span>
        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]", status.tone)}>
          {status.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-2xl font-extrabold">{formatINR(proposal.price)}</span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" /> {proposal.delivery_days} day{proposal.delivery_days === 1 ? "" : "s"}
        </span>
      </div>

      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-foreground/80">{proposal.description}</p>

      <p className="mt-3 text-[11px] text-muted-foreground">
        {proposal.creator_name || "Creator"} · offer for this task
      </p>

      {proposal.status === "pending" && isBuyer && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => onAccept(proposal)} className="rounded-full">
            <Check className="h-3.5 w-3.5" /> Accept & create order
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onReject(proposal)} className="rounded-full">
            <X className="h-3.5 w-3.5" /> Decline
          </Button>
        </div>
      )}

      {proposal.status === "pending" && !isBuyer && (
        <p className="mt-3 text-[11px] font-medium text-muted-foreground">Waiting for {proposal.buyer_name || "the task owner"} to reply.</p>
      )}

      {proposal.status === "accepted" && proposal.order_id && (
        <Link
          to="/orders"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[12px] font-semibold text-background transition-transform hover:-translate-y-0.5"
        >
          View order <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}