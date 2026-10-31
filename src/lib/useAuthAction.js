import { useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

/**
 * Returns a guard for signed-in-only actions. Guests keep browsing and get a
 * gentle nudge with a sign-in shortcut instead of a wall.
 */
export function useAuthAction() {
  const { isAuthenticated, navigateToLogin } = useAuth();

  return useCallback(
    (action = "continue") => {
      if (isAuthenticated) return true;
      toast(`Sign in to ${action}`, {
        description: "Free to join. One account for buying and selling.",
        action: { label: "Sign in", onClick: () => navigateToLogin() },
      });
      return false;
    },
    [isAuthenticated, navigateToLogin],
  );
}