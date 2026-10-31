export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-card/60 px-6 py-16 text-center">
      {Icon && (
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-foreground">
          <Icon className="h-6 w-6" strokeWidth={1.8} />
        </span>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}