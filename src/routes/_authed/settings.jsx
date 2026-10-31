import { createFileRoute } from "@tanstack/react-router";
import ProfileForm from "@/components/forms/ProfileForm";

export const Route = createFileRoute("/_authed/settings")({
  head: () => ({ meta: [{ title: "Edit profile — SKILLFLIP" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your profile</p>
        <h1 className="text-[28px] font-extrabold leading-tight md:text-[36px]">How people find you.</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          One account, both sides of the marketplace — buy what you need, sell what you're good at.
        </p>
      </header>
      <ProfileForm />
    </div>
  );
}