import { Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  title: string;
  variant: "good" | "watch";
  /** points may include **bold** segments that wrap the numbers */
  points: string[];
  delay?: number;
}

export function PointsList({ title, variant, points, delay = 3 }: Props) {
  const Icon = variant === "good" ? Check : AlertTriangle;
  const iconColor = variant === "good" ? "text-good" : "text-amber";
  const iconBg = variant === "good" ? "bg-[#E5F5EE]" : "bg-[#FFF1E0]";

  return (
    <div className={`card reveal delay-${delay}`}>
      <div className="eyebrow mb-1">{title}</div>
      <ul className="mt-2 list-none">
        {points.map((point, i) => (
          <li
            key={i}
            className="flex gap-3 py-2.5 border-b border-line last:border-0"
          >
            <span
              className={cn(
                "size-[26px] rounded-[8px] grid place-items-center shrink-0",
                iconBg,
              )}
            >
              <Icon size={15} strokeWidth={2.6} className={iconColor} />
            </span>
            <p
              className="text-[13.5px] leading-[1.5] text-ink"
              dangerouslySetInnerHTML={{ __html: renderBold(point) }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Replace **foo** with <b>foo</b> — safe because we control the AI prompt. */
function renderBold(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<b class='font-bold'>$1</b>")
    .replace(/__(.+?)__/g, "<b class='font-bold'>$1</b>");
}
