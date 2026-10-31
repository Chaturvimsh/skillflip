import { useRef, useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { submitDelivery } from "@/lib/order-fns";

const MAX_FILES = 5;
const MAX_BYTES = 20 * 1024 * 1024;

export default function DeliveryDialog({ order, open, onOpenChange, onDone }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pick = async (event) => {
    const picked = Array.from(event.target.files ?? []);
    if (!picked.length) return;
    const room = MAX_FILES - files.length;
    if (room <= 0) return toast.error(`You can attach up to ${MAX_FILES} files.`);

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of picked.slice(0, room)) {
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} is over 20 MB.`);
          continue;
        }
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        uploaded.push({ file_uri, file_name: file.name, content_type: file.type || "" });
      }
      setFiles((prev) => [...prev, ...uploaded]);
    } catch {
      toast.error("That upload failed. Try a smaller file.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!files.length && !message.trim()) return toast.error("Attach a file or write a delivery message.");
    setSaving(true);
    try {
      await submitDelivery({
        data: {
          orderId: order.id,
          deliverables: files.map(({ file_uri, file_name, content_type }) => ({ file_uri, file_name, content_type })),
          message: message.trim(),
        },
      });
      toast.success("Delivery sent to the buyer.");
      setFiles([]);
      setMessage("");
      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(error?.status === 409 ? "This order isn't open for delivery." : "Couldn't send that delivery.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-md overflow-x-hidden overflow-y-auto rounded-[24px] p-5 sm:rounded-[28px] sm:p-6">
        <DialogHeader className="min-w-0 pr-8">
          <DialogTitle className="text-xl break-words">Deliver your work</DialogTitle>
          <DialogDescription className="break-words">{order.service_title}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="min-w-0 space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full max-w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/50 px-3 py-6 text-center text-muted-foreground transition-colors hover:border-foreground/30 disabled:opacity-60 sm:px-4 sm:py-7"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
            <span className="text-[12px] font-medium break-words">{uploading ? "Uploading…" : "Attach your files"}</span>
            <span className="text-[11px] leading-relaxed break-words">Images, PDF, ZIP, docs or video · up to 5 files</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,video/*,audio/*,.zip,.doc,.docx,.txt,.psd,.ai,.fig,.sketch,.csv,.xlsx"
            onChange={pick}
            className="hidden"
          />

          {files.length > 0 && (
            <ul className="min-w-0 space-y-2">
              {files.map((file) => (
                <li key={file.file_uri} className="flex items-center gap-2 rounded-xl bg-secondary/70 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{file.file_name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((item) => item.file_uri !== file.file_uri))}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-background"
                    aria-label={`Remove ${file.file_name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            placeholder="Here's the final poster plus the source file. Tweak anything you like."
            className="min-h-[100px] w-full max-w-full rounded-2xl"
          />

          <p className="text-[11px] leading-relaxed break-words text-muted-foreground">
            Only you and the buyer can open these files. Sending a delivery moves the order to “Awaiting approval”.
          </p>

          <Button type="submit" disabled={saving || uploading} className="h-12 w-full max-w-full rounded-full text-[15px] whitespace-normal">
            {saving ? "Sending…" : "Send delivery"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}