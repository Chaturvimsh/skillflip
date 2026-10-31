import { useRef } from "react";
import { Loader2, Paperclip, Send, Sparkles } from "lucide-react";

export default function Composer({ draft, onDraft, onSubmit, onFile, uploading, sending, canPropose, onPropose, placeholder }) {
  const fileRef = useRef(null);

  const pick = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onFile(file);
  };

  return (
    <form onSubmit={onSubmit} className="border-t border-border/70 p-3">
      {canPropose && (
        <div className="mb-2 flex">
          <button
            type="button"
            onClick={onPropose}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            <Sparkles className="h-3.5 w-3.5" /> Send proposal
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={pick} />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          aria-label="Attach a photo or PDF"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-foreground/70 transition-colors hover:bg-secondary disabled:opacity-40"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </button>

        <input
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          placeholder={placeholder}
          className="h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-foreground/40"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}