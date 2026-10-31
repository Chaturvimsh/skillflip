import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { MapPin, MessageCircle, Pencil, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/Avatar";
import EmptyState from "@/components/EmptyState";
import PostCard from "@/components/PostCard";
import ServiceCard from "@/components/ServiceCard";
import { Image } from "@/components/ui/image";
import { useAuth } from "@/lib/AuthContext";
import { getProfilePage } from "@/lib/server-fns";
import { startConversation } from "@/lib/skillflip";
import { useAuthAction } from "@/lib/useAuthAction";
import { useEngagement } from "@/lib/useEngagement";

export const Route = createFileRoute("/_site/u/$username")({
  loader: async ({ params }) => {
    const data = await getProfilePage({ data: { username: params.username } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.profile?.display_name ?? "Creator"} (@${loaderData?.profile?.username ?? "creator"}) — SKILLFLIP` },
      { name: "description", content: loaderData?.profile?.bio?.slice(0, 150) || "A creator on SKILLFLIP." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, posts, services, completed } = Route.useLoaderData();
  const { user, isAuthenticated } = useAuth();
  const guard = useAuthAction();
  const navigate = useNavigate();
  const { liked, saved, deltas, toggleLike, toggleSave } = useEngagement();
  const isMe = isAuthenticated && user?.id === profile.user_id;
  const isSample = String(profile.user_id || "").startsWith("showcase");

  const message = async () => {
    if (!guard("message this creator")) return;
    if (isSample) {
      toast("This is launch gallery content", { description: "Browse real creators in Find a skill to message someone." });
      return;
    }
    const id = await startConversation({
      me: user,
      other: {
        id: profile.user_id,
        name: profile.display_name,
        username: profile.username,
        avatar: profile.avatar_url,
      },
      contextTitle: "",
    });
    if (id) navigate({ to: "/messages", search: { c: id } });
  };

  return (
    <div className="space-y-7">
      <header className="overflow-hidden rounded-[26px] border border-border/80 bg-card md:rounded-[32px]">
        <div className="relative h-32 bg-gradient-to-r from-primary via-[#8B6BFF] to-accent md:h-44">
          {profile.banner_url && (
            <Image src={profile.banner_url} alt="" fittingType="fill" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="px-5 pb-6 md:px-8">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <Avatar name={profile.display_name} src={profile.avatar_url} size="xl" className="ring-4 ring-card" />
            <div className="flex items-center gap-2 pb-1">
              {isMe ? (
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-secondary sm:py-2"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit profile
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={message}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition-transform hover:-translate-y-0.5 sm:py-2"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Message
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <h1 className="break-words text-2xl font-extrabold leading-tight md:text-[32px]">{profile.display_name}</h1>
              <p className="text-[13px] text-muted-foreground">@{profile.username}</p>
            </div>

            <p className="max-w-2xl text-[14px] leading-relaxed text-foreground/80">{profile.bio}</p>

            {profile.location && (
              <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {profile.location}
              </p>
            )}

            {profile.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground/75">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-6 border-t border-border/70 pt-4">
              {[
                { value: posts.length, label: "creations" },
                { value: services.length, label: "services" },
                { value: completed, label: "gigs done" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-xl font-bold leading-none">{stat.value}</p>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Services on offer</h2>
        {services.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No services yet"
            description={isMe ? "Turn a skill you already have into a paid gig." : "This creator hasn't listed a service yet."}
            action={
              isMe && (
                <Link to="/new-service" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
                  Offer a skill
                </Link>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Creations</h2>
        {posts.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nothing posted yet"
            description={isMe ? "Share the work you're proud of — that's how people find you." : "This creator hasn't posted work yet."}
            action={
              isMe && (
                <Link to="/new-post" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
                  Post your work
                </Link>
              )
            }
          />
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                tall={index % 3 !== 1}
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
    </div>
  );
}