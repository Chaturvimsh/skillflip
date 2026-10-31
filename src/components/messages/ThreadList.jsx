import Avatar from "@/components/Avatar";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function otherParticipant(conversation, me) {
  const mine = conversation.user_a_id === me?.id;
  return mine
    ? {
        id: conversation.user_b_id,
        name: conversation.user_b_name,
        username: conversation.user_b_username,
        avatar: conversation.user_b_avatar,
      }
    : {
        id: conversation.user_a_id,
        name: conversation.user_a_name,
        username: conversation.user_a_username,
        avatar: conversation.user_a_avatar,
      };
}

export default function ThreadList({ conversations, me, activeId, onSelect }) {
  if (conversations.length === 0) {
    return <p className="px-3 py-6 text-center text-sm text-muted-foreground">No conversations yet.</p>;
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => {
        const other = otherParticipant(conversation, me);
        const active = conversation.id === activeId;
        return (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
              active ? "bg-secondary" : "hover:bg-secondary/60",
            )}
          >
            <Avatar name={other.name} src={other.avatar} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] font-semibold">{other.name || "Creator"}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {relativeTime(conversation.last_message_at)}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                {conversation.context_title ? `${conversation.context_title} · ` : ""}
                {conversation.last_message || "Say hello 👋"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}