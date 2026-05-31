import { Check, AlertTriangle, ShieldAlert } from "lucide-react";
import type { Sentiment } from "@/lib/metrics/types";
import { cn } from "@/lib/cn";

interface Props {
  verdict: string;
  sentiment: Sentiment;
  /** small caption below the headline */
  caption?: string;
}

const STYLES = {
  nailed_it: {
    bg: "bg-[#EAF6F0]",
    captionColor: "text-[#5f7a6e]",
    iconBg: "bg-good",
    Icon: Check,
  },
  solid: {
    bg: "bg-[#EAF6F0]",
    captionColor: "text-[#5f7a6e]",
    iconBg: "bg-good",
    Icon: Check,
  },
  off_target: {
    bg: "bg-[#FFF4E6]",
    captionColor: "text-[#8a6a40]",
    iconBg: "bg-amber",
    Icon: AlertTriangle,
  },
  red_flag: {
    bg: "bg-[#FDEDE9]",
    captionColor: "text-[#8a4040]",
    iconBg: "bg-red",
    Icon: ShieldAlert,
  },
} as const;

export function VerdictBanner({ verdict, sentiment, caption }: Props) {
  const s = STYLES[sentiment];
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-[14px] px-4 py-3 reveal delay-1",
        s.bg,
      )}
    >
      <span
        className={cn(
          "size-[34px] rounded-full grid place-items-center shrink-0 text-white",
          s.iconBg,
        )}
      >
        <s.Icon size={18} strokeWidth={3} />
      </span>
      <div className="min-w-0">
        <b className="block font-display font-bold text-[15px] leading-tight">{verdict}</b>
        {caption && <small className={cn("block text-[12px] mt-0.5 leading-tight", s.captionColor)}>{caption}</small>}
      </div>
    </div>
  );
}
