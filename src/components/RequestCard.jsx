import { Link } from "@tanstack/react-router";
import { CalendarDays, IndianRupee } from "lucide-react";
import Avatar from "@/components/Avatar";
import { categoryLabel } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/format";

export default function RequestCard({ request, onOffer }) {
  return (
    <article className="flex flex-col justify-between gap-4 rounded-[26px] border border-border/80 bg-card p-5 card-hover">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
            {categoryLabel(request.category)}
          </span>
          <span className="flex items-center gap-1 text-sm font-bold text-foreground">
            <IndianRupee className="h-3.5 w-3.5" />
            {formatINR(request.budget).replace("₹", "")}
          </span>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-[17px] font-semibold leading-snug">{request.title}</h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{request.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
        <Link to="/u/$username" params={{ username: request.author_username || "creator" }} className="flex min-w-0 items-center gap-2">
          <Avatar name={request.author_name} src={request.author_avatar} size="xs" />
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-semibold leading-tight">{request.author_name}</span>
            {request.deadline && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CalendarDays className="h-3 w-3" /> by {formatDate(request.deadline)}
              </span>
            )}
          </span>
        </Link>
        <button
          type="button"
          onClick={onOffer}
          className="shrink-0 rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-semibold text-background transition-transform hover:-translate-y-0.5"
        >
          Offer help
        </button>
      </div>
    </article>
  );
}