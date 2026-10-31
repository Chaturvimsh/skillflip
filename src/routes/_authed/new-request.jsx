import { createFileRoute } from "@tanstack/react-router";
import RequestForm from "@/components/forms/RequestForm";

export const Route = createFileRoute("/_authed/new-request")({
  head: () => ({ meta: [{ title: "Post a request — SKILLFLIP" }] }),
  component: NewRequestPage,
});

function NewRequestPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Need something?</p>
        <h1 className="text-[28px] font-extrabold leading-tight md:text-[36px]">Put the task on the board.</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Say what you need and what it's worth. Creators who can do it will reach out.
        </p>
      </header>
      <RequestForm />
    </div>
  );
}