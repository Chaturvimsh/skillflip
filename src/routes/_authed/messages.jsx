import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import ChatPanel from "@/components/messages/ChatPanel";
import ThreadList from "@/components/messages/ThreadList";
import EmptyState from "@/components/EmptyState";

export const Route = createFileRoute("/_authed/messages")({
  validateSearch: (search) => ({ c: typeof search.c === "string" ? search.c : undefined }),
  head: () => ({ meta: [{ title: "Messages — SKILLFLIP" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { c } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const result = await base44.entities.Conversation.list({ sort: "-last_message_at", limit: 50 });
    setConversations(Array.isArray(result) ? result : result?.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const active = conversations.find((conversation) => conversation.id === c);

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading your conversations…</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold md:text-[32px]">Messages</h1>
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Start one from any creation or service — ask about the price, the vibe, the deadline."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold md:text-[32px]">Messages</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`rounded-[28px] border border-border/80 bg-card p-2 ${c ? "hidden md:block" : ""}`}>
          <ThreadList
            conversations={conversations}
            me={user}
            activeId={c}
            onSelect={(id) => navigate({ to: "/messages", search: { c: id } })}
          />
        </aside>

        <section className="overflow-hidden rounded-[28px] border border-border/80 bg-card">
          {active ? (
            <ChatPanel
              key={active.id}
              conversation={active}
              me={user}
              onBack={() => navigate({ to: "/messages", search: {} })}
              onSent={load}
            />
          ) : (
            <div className="grid h-[68vh] place-items-center px-6 text-center">
              <div className="space-y-2">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold">Pick a conversation</p>
                <p className="max-w-xs text-[12px] text-muted-foreground">
                  Requirements, references, prices — keep it all in one thread.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}