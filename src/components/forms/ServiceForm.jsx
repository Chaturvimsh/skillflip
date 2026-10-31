import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import UploadField from "@/components/UploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES } from "@/lib/constants";
import { ensureProfile } from "@/lib/skillflip";

export default function ServiceForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("graphic-design");
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("3");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim()) return toast.error("Give your service a name.");
    if (!Number(price)) return toast.error("Add a starting price.");
    if (!description.trim()) return toast.error("Tell people what they get.");

    setSaving(true);
    try {
      const profile = await ensureProfile(user);
      const service = await base44.entities.Service.create({
        title: title.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        delivery_days: Number(days) || 3,
        image_url: imageUrl,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        creator_id: user.id,
        creator_name: profile?.display_name || user.full_name || "Creator",
        creator_username: profile?.username,
        creator_avatar: profile?.avatar_url || "",
        active: true,
      });
      toast.success("Your skill is live.");
      navigate({ to: "/skills/$serviceId", params: { serviceId: service.id } });
    } catch {
      toast.error("Couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-[28px] border border-border/80 bg-card p-5">
        <UploadField
          value={imageUrl}
          onChange={setImageUrl}
          hint="A sample of your work works best. Stored publicly so anyone can preview it."
        />
      </div>

      <div className="space-y-5 rounded-[28px] border border-border/80 bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="title">What can you make?</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="I'll design a 3-slide event poster"
            className="rounded-2xl"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
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
            <Label htmlFor="price">Starting price (₹)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="500"
              className="rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="days">Days to deliver</Label>
            <Input
              id="days"
              type="number"
              min="1"
              value={days}
              onChange={(event) => setDays(event.target.value)}
              className="rounded-2xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">What they get</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            placeholder="Two rounds of revisions, source files, and a version sized for stories."
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="poster, event, neon"
            className="rounded-2xl"
          />
        </div>
      </div>

      <Button type="submit" disabled={saving} className="w-full rounded-full py-6 text-[15px]">
        {saving ? "Publishing…" : "Put this skill on the market"}
      </Button>
    </form>
  );
}