import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Compass, MessageSquarePlus, Sparkles, Upload } from "lucide-react";
import CategoryChips from "@/components/CategoryChips";
import EmptyState from "@/components/EmptyState";
import ExploreHero from "@/components/ExploreHero";
import PostCard from "@/components/PostCard";
import { getFeed } from "@/lib/server-fns";
import { useAuthAction } from "@/lib/useAuthAction";
import { useEngagement } from "@/lib/useEngagement";

export const Route = createFileRoute("/_site/")({
  validateSearch: (search) => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  loaderDeps: ({ search }) => ({ category: search.category }),
  loader: async ({ deps }) => await getFeed({ data: { category: deps.category } }),
  head: () => ({
    meta: [
      { title: "SKILLFLIP — Your skills. Your hustle. Your money." },
      { name: "description", content: "Explore posters, edits, photography, websites and more from everyday creators. Like, save, and book the person behind the work." },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const { posts, likeCounts, commentCounts } = Route.useLoaderData();
  const { category } = Route.useSearch();
  const navigate = useNavigate();
  const guard = useAuthAction();
  const { liked, saved, deltas, toggleLike, toggleSave } = useEngagement();

  return (
    <div className="space-y-8">
      <ExploreHero />

      <section id="feed" className="space-y-4 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold md:text-2xl">Discover creations</h2>
            <p className="text-[13px] text-muted-foreground">Real work from people you can hire in a few taps.</p>
          </div>
          <CategoryChips
            value={category}
            onChange={(next) => navigate({ to: "/", search: { category: next }, replace: true })}
          />
        </div>

        {posts.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="Nothing in this corner yet"
            description="Be the first to post here — or peek at another category."
            action={
              <Link to="/new-post" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
                Post your work
              </Link>
            }
          />
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                tall={index % 3 !== 1}
                likeCount={likeCounts[post.id] ?? 0}
                commentCount={commentCounts[post.id] ?? 0}
                liked={liked.has(post.id)}
                saved={saved.has(post.id)}
                likeDelta={deltas[post.id]?.like ?? 0}
                onLike={() => guard("like this") && toggleLike(post.id)}
                onSave={() => guard("save this") && toggleSave(post.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { to: "/new-post", icon: Upload, title: "Show your work", copy: "Drop a creation and let people tap “I can make this for you”." },
          { to: "/new-service", icon: Sparkles, title: "Offer a skill", copy: "Set a starting price and the days you need. No packages required." },
          { to: "/new-request", icon: MessageSquarePlus, title: "Need something?", copy: "Post the task, set a budget, and let creators come to you." },
        ].map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-[26px] border border-border/80 bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20"
          >
            <span className="mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-accent/40 text-foreground">
              <card.icon className="h-[18px] w-[18px]" />
            </span>
            <h3 className="text-base font-bold">{card.title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{card.copy}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}