import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { uploadMedia } from "@/lib/skillflip";

export default function UploadField({ value, onChange, onUploaded, accept = "image/*", hint }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await uploadMedia(file);
      onChange?.(url);
      onUploaded?.(url, file);
    } catch {
      setError("Upload failed. Try a smaller file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isVideo = accept.includes("video") && value && /\.(mp4|webm|mov)$/i.test(value);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-border bg-secondary/50 transition-colors hover:border-foreground/30"
      >
        {value ? (
          isVideo ? (
            <video src={value} className="h-full w-full object-cover" muted playsInline />
          ) : (
            <Image src={value} alt="Upload preview" fittingType="fill" className="h-full w-full object-cover" />
          )
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
            <span className="text-[12px] font-medium">{busy ? "Uploading…" : "Add a photo or video"}</span>
          </span>
        )}

        {value && (
          <span className="absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold backdrop-blur">
            {busy ? "Uploading…" : "Change"}
          </span>
        )}
      </button>

      <input ref={inputRef} type="file" accept={accept} onChange={pick} className="hidden" />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}