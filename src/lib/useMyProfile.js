import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export async function fetchProfileForUser(userId) {
  if (!userId) return null;
  const page = await base44.entities.Profile.filter({ user_id: userId }, { limit: 1 });
  return page?.items?.[0] ?? null;
}

export function useMyProfile() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const query = useQuery({
    queryKey: ["profile", user?.id ?? "guest"],
    enabled: !!user?.id,
    queryFn: () => fetchProfileForUser(user.id),
  });

  return {
    profile: query.data ?? null,
    isLoading: isLoadingAuth || (isAuthenticated && query.isLoading),
    refetch: query.refetch,
  };
}