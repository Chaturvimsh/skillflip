import { Link } from "@tanstack/react-router";
import MobileNav from "@/components/MobileNav";
import TopBar from "@/components/TopBar";
import Wordmark from "@/components/Wordmark";

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-16 md:pt-8">{children}</main>

      <footer className="hidden border-t border-border/70 px-8 py-8 md:block">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <Wordmark compact />
            <p className="text-xs text-muted-foreground">Your skills. Your hustle. Your money.</p>
          </div>
          <div className="flex items-center gap-5 text-xs font-medium text-muted-foreground">
            <Link to="/skills" className="hover:text-foreground">Find a skill</Link>
            <Link to="/requests" className="hover:text-foreground">Need something?</Link>
            <Link to="/new-service" className="hover:text-foreground">Start selling</Link>
          </div>
        </div>
      </footer>

      <MobileNav />
    </div>
  );
}