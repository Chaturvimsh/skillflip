export const CATEGORIES = [
  { value: "graphic-design", label: "Graphic design" },
  { value: "ai-creations", label: "AI creations" },
  { value: "video-editing", label: "Video editing" },
  { value: "photography", label: "Photography" },
  { value: "coding", label: "Coding" },
  { value: "websites", label: "Websites" },
  { value: "music", label: "Music" },
  { value: "writing", label: "Writing" },
  { value: "presentations", label: "Presentations" },
  { value: "education", label: "Education" },
  { value: "lifestyle", label: "Lifestyle" },
];

export const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? "Something creative";

export const ORDER_FLOW = {
  requested: { label: "New request", tone: "bg-accent text-accent-foreground" },
  in_progress: { label: "In progress", tone: "bg-primary text-primary-foreground" },
  delivered: { label: "Awaiting your approval", tone: "bg-sun text-foreground" },
  completed: { label: "Completed", tone: "bg-mint text-foreground" },
  declined: { label: "Declined", tone: "bg-muted text-muted-foreground" },
};