import { createFileRoute } from "@tanstack/react-router";
import ServiceForm from "@/components/forms/ServiceForm";

export const Route = createFileRoute("/_authed/new-service")({
  head: () => ({ meta: [{ title: "Offer a skill — SKILLFLIP" }] }),
  component: NewServicePage,
});

function NewServicePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Offer a skill</p>
        <h1 className="text-[28px] font-extrabold leading-tight md:text-[36px]">Get paid for what you already do.</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          No packages, no certificates. Say what you'll make, when it lands, and what it starts at.
        </p>
      </header>
      <ServiceForm />
    </div>
  );
}