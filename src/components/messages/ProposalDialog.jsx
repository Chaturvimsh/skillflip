import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProposal } from "@/lib/proposal-fns";

export default function ProposalDialog({ conversation, taskTitle, open, onOpenChange, onDone }) {
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("3");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const amount = Number(price);
    const delivery = Number(days);
    if (!amount || amount <= 0) return toast.error("Add the price you're proposing.");
    if (!delivery || delivery < 1) return toast.error("Add how many days you need.");
    if (description.trim().length < 10) return toast.error("Describe what you'll deliver (at least 10 characters).");

    setSaving(true);
    try {
      await createProposal({
        data: { conversationId: conversation.id, price: amount, deliveryDays: Math.round(delivery), description: description.trim() },
      });
      toast.success("Proposal sent");
      setPrice("");
      setDays("3");
      setDescription("");
      onDone?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.status === 409 ? "You already have a proposal waiting for a reply." : "Couldn't send that proposal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-[28px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Send a proposal</DialogTitle>
          <DialogDescription>{taskTitle || "Your offer for this task"}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="proposal-price">Your price (₹)</Label>
              <Input
                id="proposal-price"
                type="number"
                inputMode="numeric"
                min="1"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="450"
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proposal-days">Delivery (days)</Label>
              <Input
                id="proposal-days"
                type="number"
                inputMode="numeric"
                min="1"
                max="120"
                value={days}
                onChange={(event) => setDays(event.target.value)}
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proposal-description">What you'll deliver</Label>
            <Textarea
              id="proposal-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Sizes, formats, how many revisions — help them say yes."
              rows={4}
              className="rounded-2xl"
            />
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Accepting your proposal creates an order. No money moves in the app — you two settle payment directly.
          </p>

          <Button type="submit" disabled={saving} className="w-full rounded-full">
            {saving ? "Sending…" : "Send proposal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}