import { useLocation, useNavigate } from "@tanstack/react-router";
import { ClipboardList, Compass, MessageCircle, Search, User } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useMyProfile } from "@/lib/useMyProfile";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, navigateToLogin } = useAuth();
  const { profile } = useMyProfile();

  const goMe = () => {
    if (!isAuthenticated) return navigateToLogin();
    if (profile) return navigate({ to: "/u/$username", params: { username: profile.username } });
    return navigate({ to: "/settings" });
  };

  const items = [
    { key: "explore", label: "Explore", icon: Compass, to: "/" },
    { key: "skills", label: "Skills", icon: Search, to: "/skills" },
    { key: "tasks", label: "Tasks", icon: ClipboardList, to: "/requests" },
    {
      key: "inbox",
      label: "Inbox",
      icon: MessageCircle,
      onClick: () => (isAuthenticated ? navigate({ to: "/messages" }) : navigateToLogin()),
      active: location.pathname.startsWith("/messages"),
    },
    { key: "me", label: "Me", icon: User, onClick: goMe, active: location.pathname.startsWith("/u/") || location.pathname.startsWith("/settings") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {items.map((item) => {
          const active = item.active ?? (item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to));
          const Icon = item.icon;
          const content = (
            <>
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full transition-all duration-200",
                  active ? "bg-foreground text-accent" : "text-muted-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={cn("text-[10px] font-semibold", active ? "text-foreground" : "text-muted-foreground")}>
                {item.label}
              </span>
            </>
          );

          return item.to ? (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate({ to: item.to })}
              className="flex flex-1 flex-col items-center gap-0.5 py-1"
            >
              {content}
            </button>
          ) : (
            <button key={item.key} type="button" onClick={item.onClick} className="flex flex-1 flex-col items-center gap-0.5 py-1">
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}