import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import PostCard from "@/components/PostCard";
import { getSavedPosts } from "@/lib/server-fns";
import { useEngagement } from "@/lib/useEngagement";

export const Route = createFileRoute("/_authed/saved")({
  head: () => ({ meta: [{ title: "Saved posts — SKILLFLIP" }] }),
  loader: () => getSavedPosts(),
  component: SavedPage,
});

function SavedPage() {
  const { posts, likeCounts, commentCounts } = Route.useLoaderData();
  const { liked, saved, deltas, toggleLike, toggleSave } = useEngagement();
  const [hidden, setHidden] = useState(() => new Set());

  const visible = posts.filter((post) => !hidden.has(post.id));

  const unsave = async (postId) => {
    const ok = await toggleSave(postId);
    if (!ok) {
      toast.error("Couldn't remove that save.");
      return;
    }
    setHidden((prev) => new Set(prev).add(postId));
    toast.success("Removed from saved");
  };

  return (
    <div className="space-y-7">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold md:text-[32px]">Saved posts</h1>
        <p className="text-sm text-muted-foreground">Everything you bookmarked, kept private to your account.</p>
      </header>

      {visible.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap the bookmark on any post in Explore to keep it here for later."
          action={
            <Link to="/" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
              Explore creations
            </Link>
          }
        />
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
          {visible.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              tall={index % 3 !== 1}
              likeCount={likeCounts?.[post.id] ?? 0}
              commentCount={commentCounts?.[post.id] ?? 0}
              liked={liked.has(post.id)}
              saved={saved.has(post.id)}
              likeDelta={deltas[post.id]?.like ?? 0}
              onLike={() => toggleLike(post.id)}
              onSave={() => unsave(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}