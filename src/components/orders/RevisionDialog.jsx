import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { requestRevision } from "@/lib/order-fns";

export default function RevisionDialog({ order, open, onOpenChange, onDone }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await requestRevision({ data: { orderId: order.id, note: note.trim() } });
      toast.success("Sent back for changes.");
      setNote("");
      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(error?.status === 409 ? "This delivery can't be revised right now." : "Couldn't send that request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-[24px] sm:max-w-md sm:rounded-[28px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Request a revision</DialogTitle>
          <DialogDescription>Tell {order.seller_name?.split(" ")[0] || "the creator"} what needs to change.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Loved the layout — can the title be bigger and the colours warmer?"
            className="min-h-[120px] rounded-2xl"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            The order goes back to “In progress” so the creator can deliver again.
          </p>
          <Button type="submit" disabled={saving} className="h-12 w-full rounded-full text-[15px]">
            {saving ? "Sending…" : "Send revision request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}