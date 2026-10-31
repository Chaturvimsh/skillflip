import { Link } from "@tanstack/react-router";
import { Bookmark, Heart, MessageCircle, Sparkles } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Image } from "@/components/ui/image";
import { categoryLabel } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PostCard({ post, likeCount = 0, commentCount = 0, liked, saved, likeDelta = 0, onLike, onSave, tall }) {
  const creatorSlug = post.creator_username || "creator";
  const totalLikes = Math.max(0, likeCount + likeDelta);

  return (
    <article className="mb-5 break-inside-avoid overflow-hidden rounded-[26px] border border-border/80 bg-card card-hover">
      <Link to="/post/$postId" params={{ postId: post.id }} className="block">
        <div className={cn("relative overflow-hidden bg-secondary", tall ? "aspect-[3/4]" : "aspect-square")}>
          {post.media_type === "video" ? (
            <video
              src={post.media_url}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src={post.media_url}
              alt={post.caption || "Creation"}
              fittingType="fill"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground backdrop-blur">
            {categoryLabel(post.category)}
          </span>
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/u/$username"
            params={{ username: creatorSlug }}
            className="flex min-w-0 items-center gap-2.5"
          >
            <Avatar name={post.creator_name} src={post.creator_avatar} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight">{post.creator_name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                @{creatorSlug} · {formatDate(post.created_date)}
              </span>
            </span>
          </Link>
        </div>

        {post.caption && <p className="line-clamp-3 text-sm leading-relaxed text-foreground/85">{post.caption}</p>}

        <div className="flex items-center gap-4 pt-0.5 text-muted-foreground">
          <button
            type="button"
            onClick={onLike}
            className={cn("flex items-center gap-1.5 text-[13px] font-medium transition-colors", liked ? "text-primary" : "hover:text-foreground")}
            aria-label="Like"
          >
            <Heart className={cn("h-[18px] w-[18px]", liked && "fill-current")} />
            {totalLikes > 0 && totalLikes}
          </button>
          <Link
            to="/post/$postId"
            params={{ postId: post.id }}
            className="flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:text-foreground"
            aria-label="Comments"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            {commentCount > 0 && commentCount}
          </Link>
          <button
            type="button"
            onClick={onSave}
            className={cn("ml-auto transition-colors", saved ? "text-foreground" : "hover:text-foreground")}
            aria-label="Save"
          >
            <Bookmark className={cn("h-[18px] w-[18px]", saved && "fill-current")} />
          </button>
        </div>
      </div>

      {post.service_id ? (
        <Link
          to="/skills/$serviceId"
          params={{ serviceId: post.service_id }}
          className="flex items-center justify-between gap-3 border-t border-border/70 bg-accent/25 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors hover:bg-accent/45"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> I can make this for you
          </span>
          <span className="text-[12px] font-extrabold lowercase tracking-normal">
            {post.service_price ? formatINR(post.service_price) : "ask"}
          </span>
        </Link>
      ) : (
        <Link
          to="/u/$username"
          params={{ username: creatorSlug }}
          className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>See more from {post.creator_name?.split(" ")[0]}</span>
          <span aria-hidden>→</span>
        </Link>
      )}
    </article>
  );
}