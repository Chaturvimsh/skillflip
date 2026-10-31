import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bookmark, LogOut, MessageCircle, Package, Plus, Settings, Wallet, User } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useMyProfile } from "@/lib/useMyProfile";
import Avatar from "@/components/Avatar";
import Wordmark from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Explore" },
  { to: "/skills", label: "Find a skill" },
  { to: "/requests", label: "Need something?" },
];

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth, logout, navigateToLogin } = useAuth();
  const { profile } = useMyProfile();

  const isActive = (to) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));
  const meHref = profile ? { to: "/u/$username", params: { username: profile.username } } : { to: "/settings" };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Wordmark />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link
              to="/messages"
              className="hidden h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:grid"
              aria-label="Messages"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
            </Link>
          )}

          {!isLoadingAuth && !isAuthenticated && (
            <>
              <Button variant="ghost" className="hidden rounded-full md:inline-flex" onClick={navigateToLogin}>
                Sign in
              </Button>
              <Button asChild className="rounded-full px-4">
                <Link to="/register">Join free</Link>
              </Button>
            </>
          )}

          {isAuthenticated && (
            <Button asChild variant="outline" className="hidden rounded-full border-foreground/15 md:inline-flex">
              <Link to="/new-post">
                <Plus className="mr-1.5 h-4 w-4" /> Post work
              </Link>
            </Button>
          )}

          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar name={profile?.display_name || "Me"} src={profile?.avatar_url} size="sm" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel className="text-sm">
                  {profile?.display_name || "Your account"}
                  {profile?.username && <span className="block text-xs font-normal text-muted-foreground">@{profile.username}</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => (profile ? navigate(meHref) : navigate({ to: "/settings" }))}>
                  <User className="mr-2 h-4 w-4" /> My profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/saved" })}>
                  <Bookmark className="mr-2 h-4 w-4" /> Saved posts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}>
                  <Package className="mr-2 h-4 w-4" /> My orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/earnings" })}>
                  <Wallet className="mr-2 h-4 w-4" /> Earnings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <Settings className="mr-2 h-4 w-4" /> Edit profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}