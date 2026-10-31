import { Image } from "@/components/ui/image";
import { avatarGradient, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-[11px]",
  md: "h-11 w-11 text-xs",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

export default function Avatar({ name, src, size = "md", className }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br font-semibold uppercase tracking-wide text-white",
        avatarGradient(name || ""),
        SIZES[size],
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={name || "Creator"} fittingType="fill" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}