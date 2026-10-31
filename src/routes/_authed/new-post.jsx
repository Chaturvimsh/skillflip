import { createFileRoute } from "@tanstack/react-router";
import PostForm from "@/components/forms/PostForm";

export const Route = createFileRoute("/_authed/new-post")({
  head: () => ({ meta: [{ title: "Post your work — SKILLFLIP" }] }),
  component: NewPostPage,
});

function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Share your work</p>
        <h1 className="text-[28px] font-extrabold leading-tight md:text-[36px]">Put it out there.</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A poster, an edit, a beat, a little site — anything you made. Attach a price if you'd make it again.
        </p>
      </header>
      <PostForm />
    </div>
  );
}