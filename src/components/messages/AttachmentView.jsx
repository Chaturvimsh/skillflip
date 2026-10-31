import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { getAttachmentUrl } from "@/lib/message-fns";
import { cn } from "@/lib/utils";

export default function AttachmentView({ messageId, attachment, mine }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const isImage = attachment?.kind === "image";

  const load = async () => {
    setLoading(true);
    try {
      const { signed_url } = await getAttachmentUrl({ data: { messageId } });
      setUrl(signed_url);
      return signed_url;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isImage) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  const open = async () => {
    const target = url || (await load());
    if (target) window.open(target, "_blank", "noopener,noreferrer");
  };

  if (isImage) {
    return (
      <button type="button" onClick={open} className="block w-full overflow-hidden rounded-2xl bg-black/10">
        {url ? (
          <Image src={url} alt={attachment.file_name || "Attachment"} fittingType="fill" className="max-h-60 w-full object-cover" />
        ) : (
          <span className="grid h-40 w-full place-items-center">
            {loading ? <Loader2 className="h-5 w-5 animate-spin opacity-60" /> : <FileText className="h-5 w-5 opacity-60" />}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left",
        mine ? "bg-background/15" : "bg-card border border-border/70",
      )}
    >
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", mine ? "bg-background/20" : "bg-secondary")}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold">{attachment?.file_name || "PDF"}</span>
        <span className={cn("block text-[10px]", mine ? "text-background/60" : "text-muted-foreground")}>Open PDF</span>
      </span>
    </button>
  );
}