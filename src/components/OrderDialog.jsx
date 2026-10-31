import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatINR } from "@/lib/format";
import { createOrder } from "@/lib/order-fns";

export default function OrderDialog({ service, open, onOpenChange }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createOrder({ data: { serviceId: service.id, notes: notes.trim() } });
      onOpenChange(false);
      setNotes("");
      toast("Request sent", { description: `${service.creator_name} will reply in your messages.` });
      navigate({ to: "/orders" });
    } catch (error) {
      toast.error(
        error?.status === 409
          ? "You already have an open request for this skill."
          : error?.status === 400
            ? "This is your own skill."
            : "Couldn't send the request. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[28px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Request this skill</DialogTitle>
          <DialogDescription>{service.title}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
            <span className="text-[12px] font-medium text-muted-foreground">Starting price</span>
            <span className="font-display text-lg font-bold">{formatINR(service.price)}</span>
          </div>

          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What do you need? Deadline, style, links to references…"
            rows={4}
            className="rounded-2xl"
          />

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            This sends a request, not a payment. You and {service.creator_name?.split(" ")[0]} agree on the
            details in messages before any money moves.
          </p>

          <Button type="submit" disabled={saving} className="w-full rounded-full">
            {saving ? "Sending…" : "Send request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}