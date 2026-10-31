import { Outlet, createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  beforeLoad: requireSignedIn,
  errorComponent: AuthGateError,
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}