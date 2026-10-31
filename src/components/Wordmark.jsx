import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Wordmark({ className, compact = false }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-2", className)} aria-label="SKILLFLIP home">
      <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-foreground text-accent transition-transform duration-300 group-hover:-rotate-6">
        <Zap className="h-[18px] w-[18px]" strokeWidth={2.6} />
      </span>
      <span className="font-display text-[19px] font-extrabold uppercase leading-none tracking-[-0.04em]">
        Skill<span className="text-primary">flip</span>
        {!compact && <span className="ml-0.5 align-super text-[9px] font-bold text-muted-foreground">™</span>}
      </span>
    </Link>
  );
}