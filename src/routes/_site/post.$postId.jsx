import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, Heart, Sparkles } from "lucide-react";
import Avatar from "@/components/Avatar";
import CommentThread from "@/components/CommentThread";
import { Image } from "@/components/ui/image";
import { categoryLabel } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/format";
import { getPostDetail } from "@/lib/server-fns";
import { useAuthAction } from "@/lib/useAuthAction";
import { useEngagement } from "@/lib/useEngagement";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_site/post/$postId")({
  loader: async ({ params }) => {
    const detail = await getPostDetail({ data: { postId: params.postId } });
    if (!detail) throw notFound();
    return detail;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.post?.caption?.slice(0, 60) || "Creation"} — SKILLFLIP` },
      { name: "description", content: loaderData?.post?.caption?.slice(0, 150) || "A creation on SKILLFLIP." },
    ],
  }),
  component: PostDetailPage,
});

function PostDetailPage() {
  const { post, comments, likeCount } = Route.useLoaderData();
  const guard = useAuthAction();
  const { liked, saved, deltas, toggleLike, toggleSave } = useEngagement();
  const totalLikes = Math.max(0, likeCount + (deltas[post.id]?.like ?? 0));

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to explore
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="overflow-hidden rounded-[28px] border border-border/80 bg-card">
          {post.media_type === "video" ? (
            <video src={post.media_url} controls playsInline className="h-full w-full object-cover" />
          ) : (
            <Image src={post.media_url} alt={post.caption || "Creation"} fittingType="fit" className="h-full w-full object-contain" />
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-border/80 bg-card p-5">
            <div className="flex items-center gap-3">
              <Link to="/u/$username" params={{ username: post.creator_username || "creator" }}>
                <Avatar name={post.creator_name} src={post.creator_avatar} size="md" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to="/u/$username"
                  params={{ username: post.creator_username || "creator" }}
                  className="block truncate text-[15px] font-semibold leading-tight hover:underline"
                >
                  {post.creator_name}
                </Link>
                <p className="truncate text-[12px] text-muted-foreground">
                  @{post.creator_username || "creator"} · {formatDate(post.created_date)}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/70">
                {categoryLabel(post.category)}
              </span>
            </div>

            {post.caption && <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-foreground/85">{post.caption}</p>}

            {post.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center gap-4 border-t border-border/70 pt-4">
              <button
                type="button"
                onClick={() => guard("like this") && toggleLike(post.id)}
                className={cn("flex items-center gap-1.5 text-[13px] font-semibold", liked.has(post.id) ? "text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                <Heart className={cn("h-[18px] w-[18px]", liked.has(post.id) && "fill-current")} />
                {totalLikes > 0 ? totalLikes : "Like"}
              </button>
              <button
                type="button"
                onClick={() => guard("save this") && toggleSave(post.id)}
                className={cn("ml-auto flex items-center gap-1.5 text-[13px] font-semibold", saved.has(post.id) ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <Bookmark className={cn("h-[18px] w-[18px]", saved.has(post.id) && "fill-current")} />
                Save
              </button>
            </div>
          </div>

          {post.service_id && (
            <Link
              to="/skills/$serviceId"
              params={{ serviceId: post.service_id }}
              className="flex items-center justify-between gap-3 rounded-[24px] bg-accent px-5 py-4 text-accent-foreground transition-transform hover:-translate-y-0.5"
            >
              <span className="text-[12px] font-extrabold uppercase tracking-[0.1em]">
                <Sparkles className="mr-1.5 inline h-4 w-4" /> I can make this for you
              </span>
              <span className="font-display text-base font-bold">{formatINR(post.service_price)}</span>
            </Link>
          )}

          <div className="rounded-[28px] border border-border/80 bg-card p-5">
            <CommentThread postId={post.id} initialComments={comments} />
          </div>
        </div>
      </div>
    </div>
  );
}