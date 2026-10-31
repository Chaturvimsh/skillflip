import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

export default function CategoryChips({ value, onChange, className, includeAll = true }) {
  const chips = includeAll ? [{ value: "all", label: "Everything" }, ...CATEGORIES] : CATEGORIES;

  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1", className)}>
      {chips.map((chip) => {
        const active = (value || "all") === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onChange?.(chip.value === "all" ? undefined : chip.value)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200",
              active
                ? "border-foreground bg-foreground text-background shadow-sm"
                : "border-border bg-card/70 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}