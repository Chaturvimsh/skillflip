import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Image } from "@/components/ui/image";
import { categoryLabel } from "@/lib/constants";
import { formatINR } from "@/lib/format";

export default function ServiceCard({ service }) {
  return (
    <Link
      to="/skills/$serviceId"
      params={{ serviceId: service.id }}
      className="group flex flex-col overflow-hidden rounded-[26px] border border-border/80 bg-card card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {service.image_url ? (
          <Image
            src={service.image_url}
            alt={service.title}
            fittingType="fill"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/15 to-accent/40 font-display text-2xl font-bold text-foreground/60">
            {service.creator_name?.slice(0, 2).toUpperCase() || "SF"}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] backdrop-blur">
          {categoryLabel(service.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{service.title}</h3>
          <p className="text-[11px] text-muted-foreground">
            by @{service.creator_username || "creator"} · delivers in {service.delivery_days || 3} days
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <Avatar name={service.creator_name} src={service.creator_avatar} size="xs" />
            <span className="text-[11px] font-medium text-foreground/80">{service.creator_name}</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">from</p>
            <p className="font-display text-base font-bold leading-none">{formatINR(service.price)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}