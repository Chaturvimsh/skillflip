import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/AuthContext";
import { useMyProfile } from "@/lib/useMyProfile";
import { ensureProfile, uploadMedia } from "@/lib/skillflip";

const splitList = (value) =>
  value.split(",").map((item) => item.trim()).filter(Boolean);

export default function ProfileForm() {
  const { user } = useAuth();
  const { profile, isLoading, refetch } = useMyProfile();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    username: "",
    bio: "",
    location: "",
    skills: "",
    interests: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (isLoading) return;
    setForm({
      display_name: profile?.display_name || user?.full_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      skills: (profile?.skills ?? []).join(", "),
      interests: (profile?.interests ?? []).join(", "),
      avatar_url: profile?.avatar_url || "",
    });
  }, [isLoading, profile?.id, user?.id]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const onAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file);
      setForm((prev) => ({ ...prev, avatar_url: url }));
    } catch {
      toast.error("Upload failed. Try a smaller image.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const username = form.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!form.display_name.trim()) return toast.error("Add your name.");
    if (username.length < 3) return toast.error("Pick a username of at least 3 characters.");

    setSaving(true);
    try {
      const saved = await ensureProfile(user);
      await base44.entities.Profile.update(saved.id, {
        display_name: form.display_name.trim(),
        username,
        bio: form.bio.trim(),
        location: form.location.trim(),
        skills: splitList(form.skills),
        interests: splitList(form.interests),
        avatar_url: form.avatar_url,
      });
      await refetch();
      toast.success("Profile saved.");
      navigate({ to: "/u/$username", params: { username } });
    } catch {
      toast.error("Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center gap-4 rounded-[28px] border border-border/80 bg-card p-5">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative">
          <Avatar name={form.display_name || "You"} src={form.avatar_url} size="xl" />
          <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-foreground text-background">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <div>
          <p className="text-[14px] font-semibold">{uploading ? "Uploading…" : "Your profile photo"}</p>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Stored publicly so people can recognise you across the feed.
          </p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onAvatar} className="hidden" />
      </div>

      <div className="space-y-5 rounded-[28px] border border-border/80 bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="display_name">Name</Label>
            <Input id="display_name" value={form.display_name} onChange={set("display_name")} className="rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={form.username}
              onChange={set("username")}
              placeholder="yourname"
              className="rounded-2xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Short bio</Label>
          <Textarea
            id="bio"
            value={form.bio}
            onChange={set("bio")}
            rows={3}
            placeholder="Third-year student. I make posters and reels for campus events."
            className="rounded-2xl"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={set("location")} placeholder="Mumbai" className="rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interests">Interests</Label>
            <Input
              id="interests"
              value={form.interests}
              onChange={set("interests")}
              placeholder="streetwear, anime, lo-fi"
              className="rounded-2xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills">Your skills</Label>
          <Input
            id="skills"
            value={form.skills}
            onChange={set("skills")}
            placeholder="poster design, reel editing, AI art"
            className="rounded-2xl"
          />
          <p className="text-[11px] text-muted-foreground">Separate with commas. These show on your profile.</p>
        </div>
      </div>

      <Button type="submit" disabled={saving} className="w-full rounded-full py-6 text-[15px]">
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}