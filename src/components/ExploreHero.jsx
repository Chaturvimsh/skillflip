import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

const TEASER = ["Make me a poster", "Edit my reel", "Design my deck", "Build my site", "Fix my logo"];

export default function ExploreHero() {
  return (
    <section className="relative overflow-hidden rounded-[26px] bg-foreground px-5 py-9 text-background sm:px-8 md:rounded-[32px] md:px-12 md:py-16">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary/70 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-accent/40 blur-[80px]" />

      <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="max-w-2xl space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Social marketplace for everyday skills
          </span>

          <h1 className="text-[32px] font-extrabold leading-[0.96] tracking-[-0.04em] text-balance sm:text-[38px] md:text-[64px] md:leading-[0.93]">
            Your skills.
            <br />
            <span className="text-accent">Your hustle.</span>
            <br />
            Your money.
          </h1>

          <p className="max-w-md text-[15px] leading-relaxed text-background/70">
            No degrees, no résumés, no waiting to be picked. Post what you can make, get small paid gigs
            from real people, and keep your creative streak going.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/skills"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition-transform duration-200 hover:-translate-y-0.5"
            >
              Find a skill <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/new-service"
              className="inline-flex items-center gap-2 rounded-full border border-background/25 px-5 py-3 text-sm font-semibold text-background transition-colors hover:bg-background/10"
            >
              Start earning
            </Link>
          </div>
        </div>

        <div className="relative shrink-0 md:w-64">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-background/50">
            {CATEGORIES.length} ways to make it happen
          </p>
          <div className="flex flex-wrap gap-2">
            {TEASER.map((item, index) => (
              <span
                key={item}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                  index % 3 === 0
                    ? "bg-background/12 text-background/85"
                    : index % 3 === 1
                      ? "bg-background text-foreground"
                      : "border border-background/25 text-background/70"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}