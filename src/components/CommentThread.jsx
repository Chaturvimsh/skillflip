import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAuthAction } from "@/lib/useAuthAction";
import { useMyProfile } from "@/lib/useMyProfile";
import Avatar from "@/components/Avatar";
import { formatDate } from "@/lib/format";

export default function CommentThread({ postId, initialComments }) {
  const [comments, setComments] = useState(initialComments ?? []);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { profile } = useMyProfile();
  const guard = useAuthAction();

  const submit = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    if (!guard("comment")) return;
    setSending(true);
    try {
      const created = await base44.entities.Comment.create({
        post_id: postId,
        body: body.trim(),
        author_name: profile?.display_name || user?.full_name || "Someone",
        author_username: profile?.username || "",
        author_avatar: profile?.avatar_url || "",
      });
      setComments((prev) => [...prev, created]);
      setBody("");
    } catch {
      setSending(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-base font-bold">
        Comments {comments.length > 0 && <span className="text-muted-foreground">({comments.length})</span>}
      </h2>

      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet — say something nice about this work.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar name={comment.author_name} src={comment.author_avatar} size="xs" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-snug">
                <Link
                  to="/u/$username"
                  params={{ username: comment.author_username || "creator" }}
                  className="font-semibold hover:underline"
                >
                  {comment.author_name}
                </Link>{" "}
                <span className="text-[11px] text-muted-foreground">{formatDate(comment.created_date)}</span>
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/85">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 rounded-full border border-border bg-background p-1.5 pl-4 focus-within:border-foreground/40">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add a comment…"
          className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-40"
          aria-label="Post comment"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}