import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import UploadField from "@/components/UploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES } from "@/lib/constants";
import { ensureProfile } from "@/lib/skillflip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PostForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("graphic-design");
  const [tags, setTags] = useState("");
  const [attach, setAttach] = useState(false);
  const [serviceTitle, setServiceTitle] = useState("");
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("3");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!mediaUrl) return toast.error("Add a photo or video of your work first.");
    if (!caption.trim()) return toast.error("Add a short description of what you made.");
    if (attach && (!serviceTitle.trim() || !Number(price))) {
      return toast.error("Add a service name and a starting price.");
    }

    setSaving(true);
    try {
      const profile = await ensureProfile(user);
      const creator = {
        creator_name: profile?.display_name || user.full_name || "Creator",
        creator_username: profile?.username,
        creator_avatar: profile?.avatar_url || "",
      };

      const post = {
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption.trim(),
        category,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        ...creator,
      };

      if (attach) {
        const service = await base44.entities.Service.create({
          title: serviceTitle.trim(),
          description: caption.trim(),
          category,
          price: Number(price),
          delivery_days: Number(days) || 3,
          image_url: mediaUrl,
          tags: post.tags,
          creator_id: user.id,
          active: true,
          ...creator,
        });
        post.service_id = service.id;
        post.service_title = service.title;
        post.service_price = service.price;
        post.service_delivery_days = service.delivery_days;
      }

      await base44.entities.Post.create(post);
      toast.success("Posted — your work is live.");
      navigate({ to: "/u/$username", params: { username: profile.username } });
    } catch {
      toast.error("Couldn't publish that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-[28px] border border-border/80 bg-card p-5">
        <UploadField
          value={mediaUrl}
          onChange={setMediaUrl}
          accept="image/*,video/*"
          onUploaded={(_url, file) => setMediaType(file.type.startsWith("video") ? "video" : "image")}
          hint="Photos and videos are stored publicly so anyone can see your work in the feed."
        />
      </div>

      <div className="space-y-5 rounded-[28px] border border-border/80 bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="caption">What did you make?</Label>
          <Textarea
            id="caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={4}
            placeholder="Made this neon poster for a college fest. Turnaround was two hours."
            className="rounded-2xl"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Skill category</Label>
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
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="poster, neon, fest"
              className="rounded-2xl"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-[28px] border border-border/80 bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold">Add “I can make this for you”</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
              Turn this post into a bookable service with your own price.
            </p>
          </div>
          <Switch checked={attach} onCheckedChange={setAttach} />
        </div>

        {attach && (
          <div className="space-y-4 border-t border-border/70 pt-4">
            <div className="space-y-2">
              <Label htmlFor="serviceTitle">Service name</Label>
              <Input
                id="serviceTitle"
                value={serviceTitle}
                onChange={(event) => setServiceTitle(event.target.value)}
                placeholder="Custom neon-style event poster"
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Starting price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="800"
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
          </div>
        )}
      </div>

      <Button type="submit" disabled={saving} className="w-full rounded-full py-6 text-[15px]">
        {saving ? "Publishing…" : "Publish to the feed"}
      </Button>
    </form>
  );
}