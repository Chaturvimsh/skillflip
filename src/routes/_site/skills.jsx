import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import CategoryChips from "@/components/CategoryChips";
import EmptyState from "@/components/EmptyState";
import ServiceCard from "@/components/ServiceCard";
import { getServices } from "@/lib/server-fns";

export const Route = createFileRoute("/_site/skills")({
  validateSearch: (search) => ({
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q, category: search.category }),
  loader: async ({ deps }) => await getServices({ data: { q: deps.q, category: deps.category } }),
  head: () => ({
    meta: [
      { title: "Find a skill — SKILLFLIP" },
      { name: "description", content: "Browse people offering graphic design, AI creations, video editing, photography, coding, music and more. Real prices, real delivery times." },
    ],
  }),
  component: SkillsPage,
});

function SkillsPage() {
  const services = Route.useLoaderData();
  const { q, category } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q ?? "");
  const timer = useRef(null);

  useEffect(() => setTerm(q ?? ""), [q]);

  const onSearch = (value) => {
    setTerm(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      navigate({ to: "/skills", search: { q: value || undefined, category }, replace: true });
    }, 350);
  };

  return (
    <div className="space-y-7">
      <header className="space-y-5 rounded-[32px] border border-border/70 bg-card px-6 py-8 md:px-10 md:py-10">
        <div className="max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Find a skill
          </span>
          <h1 className="text-[30px] font-extrabold leading-[1.02] md:text-[44px]">
            Somebody out there can make exactly what you need.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            No agencies, no packages. Pick the person whose work you like and get it done.
          </p>
        </div>

        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Try “poster”, “reel edit”, “portfolio site”…"
            className="h-[52px] w-full rounded-full border border-border bg-background py-3.5 pl-12 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/40"
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CategoryChips
          value={category}
          onChange={(next) => navigate({ to: "/skills", search: { q: q || undefined, category: next }, replace: true })}
        />
        <p className="text-[12px] font-medium text-muted-foreground">
          {services.length} {services.length === 1 ? "creator" : "creators"} available
        </p>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No one here yet"
          description="Try another word or category — or be the first to offer this skill yourself."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}