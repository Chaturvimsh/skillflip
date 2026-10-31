import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES } from "@/lib/constants";
import { ensureProfile } from "@/lib/skillflip";

export default function RequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("graphic-design");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim()) return toast.error("What do you need done?");
    if (!Number(budget)) return toast.error("Add a budget so creators know the range.");
    if (!description.trim()) return toast.error("A couple of lines of detail helps a lot.");

    setSaving(true);
    try {
      const profile = await ensureProfile(user);
      await base44.entities.SkillRequest.create({
        title: title.trim(),
        description: description.trim(),
        category,
        budget: Number(budget),
        deadline: deadline || "",
        author_id: user.id,
        author_name: profile?.display_name || user.full_name || "Someone",
        author_username: profile?.username || "",
        author_avatar: profile?.avatar_url || "",
        status: "open",
      });
      toast.success("Your request is on the board.");
      navigate({ to: "/requests" });
    } catch {
      toast.error("Couldn't post that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-5 rounded-[28px] border border-border/80 bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="title">What do you need?</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="A poster for our college fest, out by Friday"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Details</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            placeholder="Theme, size, references, where it'll be used — the more the better."
            className="rounded-2xl"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget (₹)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="1200"
              className="rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="rounded-2xl"
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={saving} className="w-full rounded-full py-6 text-[15px]">
        {saving ? "Posting…" : "Post to the task board"}
      </Button>
    </form>
  );
}