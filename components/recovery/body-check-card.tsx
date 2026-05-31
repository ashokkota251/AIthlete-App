"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  BODY_AREA_LABELS,
  areasForSport,
  sportForActivityType,
  type BodyArea,
} from "@/lib/recovery";

interface Props {
  activityName: string;
  activityType: string;
  delay?: number;
}

const SHOW = 8;

export function BodyCheckCard({ activityName, activityType, delay = 6 }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const sport = sportForActivityType(activityType);
  const ordered = areasForSport(sport).slice(0, SHOW);

  if (dismissed) {
    return (
      <div className={cn("card flex items-center gap-2.5 text-good reveal", `delay-${delay}`)}>
        <span className="size-8 rounded-xl bg-emerald-50 grid place-items-center shrink-0">
          <Check size={16} strokeWidth={2.6} />
        </span>
        <p className="text-[13px] font-medium">
          Marked all good. Treat tomorrow as recovery anyway.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("card reveal", `delay-${delay}`)}>
      <div className="flex items-center gap-2 mb-1">
        <span className="size-7 rounded-xl bg-coral-soft grid place-items-center text-coral shrink-0">
          <Sparkles size={13} strokeWidth={2.4} />
        </span>
        <div className="eyebrow">Feeling anywhere?</div>
      </div>
      <h3 className="font-display font-bold text-[16px] leading-tight mt-1">
        How&apos;s the body?
      </h3>
      <p className="mt-1 text-[12.5px] text-muted leading-snug">
        Tap a spot you&apos;re feeling — I&apos;ll suggest targeted stretches.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ordered.map((area) => (
          <BodyAreaChip key={area} area={area} activityName={activityName} />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end">
        <button
          onClick={() => setDismissed(true)}
          className="text-[11.5px] font-display font-semibold text-muted hover:text-ink transition-colors px-2 py-1 inline-flex items-center gap-1.5"
        >
          All good
          <Check size={12} strokeWidth={2.6} className="text-good" />
        </button>
      </div>
    </div>
  );
}

function BodyAreaChip({ area, activityName }: { area: BodyArea; activityName: string }) {
  const label = BODY_AREA_LABELS[area];
  const q = encodeURIComponent(
    `After my ${activityName}, I've got tightness in my ${label.toLowerCase()}. What stretches should I do?`,
  );
  return (
    <Link
      href={`/coach?q=${q}`}
      prefetch
      className={cn(
        "px-3 py-1.5 rounded-pill text-[12.5px] font-display font-semibold",
        "bg-paper border border-line text-ink",
        "hover:border-coral hover:text-coral hover:bg-coral-soft/40",
        "active:scale-[0.97] transition-all",
      )}
    >
      {label}
    </Link>
  );
}
