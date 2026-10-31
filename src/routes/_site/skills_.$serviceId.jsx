import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarClock, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Avatar from "@/components/Avatar";
import OrderDialog from "@/components/OrderDialog";
import ServiceCard from "@/components/ServiceCard";
import { Image } from "@/components/ui/image";
import { useAuth } from "@/lib/AuthContext";
import { categoryLabel } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { getServiceDetail } from "@/lib/server-fns";
import { startConversation } from "@/lib/skillflip";
import { useAuthAction } from "@/lib/useAuthAction";

export const Route = createFileRoute("/_site/skills_/$serviceId")({
  loader: async ({ params }) => {
    const detail = await getServiceDetail({ data: { serviceId: params.serviceId } });
    if (!detail) throw notFound();
    return detail;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.service?.title ?? "Skill"} — SKILLFLIP` },
      { name: "description", content: loaderData?.service?.description?.slice(0, 150) || "Book this skill on SKILLFLIP." },
    ],
  }),
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { service, more, samples } = Route.useLoaderData();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const guard = useAuthAction();
  const navigate = useNavigate();

  const request = () => {
    if (!guard("request this skill")) return;
    if (!service.creator_id) {
      toast("This is launch gallery content", {
        description: "It's sample work, not a live listing. Browse real creators in Find a skill.",
      });
      return;
    }
    setOpen(true);
  };

  const message = async () => {
    if (!guard("message this creator")) return;
    if (!service.creator_id) {
      toast("This is launch gallery content", { description: "Browse real creators to message someone." });
      return;
    }
    const id = await startConversation({
      me: user,
      other: {
        id: service.creator_id,
        name: service.creator_name,
        username: service.creator_username,
        avatar: service.creator_avatar,
      },
      contextTitle: service.title,
    });
    if (id) navigate({ to: "/messages", search: { c: id } });
  };

  return (
    <div className="space-y-6">
      <Link to="/skills" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to skills
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[28px] border border-border/80 bg-card">
            {service.image_url ? (
              <Image
                src={service.image_url}
                alt={service.title}
                fittingType="fill"
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-primary/20 to-accent/40 font-display text-3xl font-bold text-foreground/50">
                {service.creator_name?.slice(0, 2).toUpperCase() || "SF"}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-[28px] border border-border/80 bg-card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
                {categoryLabel(service.category)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]">
                <CalendarClock className="h-3 w-3" /> {service.delivery_days || 3} days
              </span>
            </div>
            <h1 className="text-[26px] font-extrabold leading-tight md:text-[34px]">{service.title}</h1>
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-foreground/80">{service.description}</p>

            {service.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {service.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-[28px] border border-border/80 bg-card p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Starting at</p>
              <p className="font-display text-[34px] font-extrabold leading-none">{formatINR(service.price)}</p>
            </div>

            <button
              type="button"
              onClick={request}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-sm font-bold text-background transition-transform hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" /> Request this skill
            </button>
            <button
              type="button"
              onClick={message}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-foreground/15 px-5 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              <MessageCircle className="h-4 w-4" /> Message creator
            </button>
            <p className="text-center text-[11px] text-muted-foreground">Free to ask. No commitment until you both agree.</p>
          </div>

          <Link
            to="/u/$username"
            params={{ username: service.creator_username || "creator" }}
            className="flex items-center gap-3 rounded-[28px] border border-border/80 bg-card p-5 transition-colors hover:border-foreground/20"
          >
            <Avatar name={service.creator_name} src={service.creator_avatar} size="md" />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">{service.creator_name}</p>
              <p className="truncate text-[12px] text-muted-foreground">@{service.creator_username || "creator"}</p>
            </div>
            <span className="ml-auto text-muted-foreground" aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {samples?.length > 0 && (
        <section className="space-y-4 pt-2">
          <h2 className="text-lg font-bold">Work samples</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {samples.map((post) => (
              <Link
                key={post.id}
                to="/post/$postId"
                params={{ postId: post.id }}
                className="group overflow-hidden rounded-2xl border border-border/80 bg-card"
              >
                {post.media_type === "video" ? (
                  <video
                    src={post.media_url}
                    muted
                    playsInline
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <Image
                    src={post.media_url}
                    alt={post.caption || "Work sample"}
                    fittingType="fill"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="space-y-4 pt-2">
          <h2 className="text-lg font-bold">More from {service.creator_name?.split(" ")[0]}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((item) => (
              <ServiceCard key={item.id} service={item} />
            ))}
          </div>
        </section>
      )}

      {service.creator_id && <OrderDialog service={service} open={open} onOpenChange={setOpen} />}
    </div>
  );
}