import { cn } from "@/lib/cn";

interface AvatarProps {
  src?: string | null;
  initials: string;
  size?: number;
  ring?: boolean;
  className?: string;
}

export function Avatar({ src, initials, size = 44, ring = false, className }: AvatarProps) {
  const s = { width: size, height: size };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        style={s}
        className={cn("rounded-full object-cover", ring && "ring-2 ring-coral/40 ring-offset-2 ring-offset-cream", className)}
      />
    );
  }
  return (
    <div
      style={s}
      className={cn(
        "rounded-full grid place-items-center font-display text-white shadow-sm",
        ring && "ring-2 ring-coral/30 ring-offset-2 ring-offset-cream",
        className,
      )}
    >
      <div
        className="rounded-full w-full h-full grid place-items-center"
        style={{
          background: "linear-gradient(135deg, #FF8A4D 0%, #F2541B 50%, #B23006 100%)",
        }}
      >
        <span style={{ fontSize: size * 0.36, letterSpacing: "-0.05em", fontWeight: 600 }}>
          {initials}
        </span>
      </div>
    </div>
  );
}
