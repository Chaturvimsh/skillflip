import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Avatar from "@/components/Avatar";
import { otherParticipant } from "@/components/messages/ThreadList";
import { formatTime, relativeTime } from "@/lib/format";
import { sendMessage } from "@/lib/skillflip";
import { cn } from "@/lib/utils";

export default function ChatPanel({ conversation, me, onBack, onSent }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const other = otherParticipant(conversation, me);

  useEffect(() => {
    let alive = true;
    setMessages([]);
    base44.entities.Message.filter(
      { conversation_id: conversation.id },
      { sort: "created_date", limit: 200 },
    ).then((page) => {
      if (alive) setMessages(page?.items ?? []);
    });

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event?.data?.conversation_id !== conversation.id || event.type !== "create") return;
      setMessages((prev) => (prev.some((item) => item.id === event.data.id) ? prev : [...prev, event.data]));
    });

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      await sendMessage({ conversation, me, body });
      onSent?.();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[68vh] flex-col">
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
        {onBack && (
          <button type="button" onClick={onBack} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <Avatar name={other.name} src={other.avatar} size="sm" />
        <div className="min-w-0">
          {other.username ? (
            <Link
              to="/u/$username"
              params={{ username: other.username }}
              className="block truncate text-[14px] font-semibold hover:underline"
            >
              {other.name}
            </Link>
          ) : (
            <p className="truncate text-[14px] font-semibold">{other.name}</p>
          )}
          <p className="truncate text-[11px] text-muted-foreground">
            {conversation.context_title || "Direct message"}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-[13px] text-muted-foreground">
            This is the start of something. Say what you need, share a reference, agree on a price.
          </p>
        )}
        {messages.map((message) => {
          const mine = message.sender_id === me.id;
          return (
            <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-[20px] px-3.5 py-2.5 text-[13px] leading-relaxed",
                  mine ? "bg-foreground text-background" : "bg-secondary text-foreground",
                )}
              >
                <p className="whitespace-pre-line">{message.body}</p>
                <p className={cn("mt-1 text-[10px]", mine ? "text-background/50" : "text-muted-foreground")}>
                  {formatTime(message.created_date)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border/70 p-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Message ${other.name?.split(" ")[0] || "creator"}…`}
          className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-foreground/40"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="grid h-11 w-11 place-items-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}