import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import RequestCard from "@/components/RequestCard";
import { getRequests } from "@/lib/server-fns";
import { startConversation } from "@/lib/skillflip";
import { useAuth } from "@/lib/AuthContext";
import { useAuthAction } from "@/lib/useAuthAction";

export const Route = createFileRoute("/_site/requests")({
  loader: async () => await getRequests({ data: {} }),
  head: () => ({
    meta: [
      { title: "Need something? — SKILLFLIP" },
      { name: "description", content: "Small tasks posted by real people: a poster before Friday, a reel edit, a deck. Pick one and offer your skills." },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const requests = Route.useLoaderData();
  const { user } = useAuth();
  const guard = useAuthAction();
  const navigate = useNavigate();

  const offer = async (request) => {
    if (!guard("offer help")) return;
    if (!request.author_id) {
      toast("This is a launch sample", { description: "Browse open tasks from real accounts — or post your own." });
      return;
    }
    const id = await startConversation({
      me: user,
      other: {
        id: request.author_id,
        name: request.author_name,
        username: request.author_username,
        avatar: request.author_avatar,
      },
      contextTitle: request.title,
      requestId: request.id,
    });
    if (id) navigate({ to: "/messages", search: { c: id } });
  };

  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-[32px] bg-foreground px-6 py-9 text-background md:px-10 md:py-11">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/30 blur-[70px]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-background/50">
              The task board
            </span>
            <h1 className="text-[30px] font-extrabold leading-[1.02] md:text-[42px]">Need something?</h1>
            <p className="text-sm leading-relaxed text-background/70">
              Someone nearby can probably do it. Post the task with a budget and a deadline — creators will come to you.
            </p>
          </div>
          <Link
            to="/new-request"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5"
          >
            <MessageSquarePlus className="h-4 w-4" /> Post a request
          </Link>
        </div>
      </header>

      {requests.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title="No open requests yet"
          description="Be the first to put a task on the board. It takes less than a minute."
          action={
            <Link to="/new-request" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
              Post a request
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} onOffer={() => offer(request)} />
          ))}
        </div>
      )}
    </div>
  );
}