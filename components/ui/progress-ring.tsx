"use client";

import { useEffect, useRef } from "react";

interface ProgressRingProps {
  /** 0..1 */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** content rendered inside the ring */
  children?: React.ReactNode;
  /** start animation delay in ms — coordinate with stagger */
  animateDelay?: number;
  track?: string;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  children,
  animateDelay = 0,
  track = "rgba(20, 16, 8, 0.06)",
}: ProgressRingProps) {
  const v = Math.max(0, Math.min(1, value));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const target = circumference * (1 - v);
  const ref = useRef<SVGCircleElement | null>(null);
  const gradientId = `ring-grad-${Math.round(v * 1000)}-${size}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.strokeDasharray = `${circumference}`;
    el.style.strokeDashoffset = `${circumference}`;
    const t = window.setTimeout(() => {
      el.animate(
        [{ strokeDashoffset: circumference }, { strokeDashoffset: target }],
        { duration: 1100, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", fill: "forwards" },
      );
    }, animateDelay);
    return () => window.clearTimeout(t);
  }, [animateDelay, circumference, target]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8A4D" />
            <stop offset="60%" stopColor="#F2541B" />
            <stop offset="100%" stopColor="#D8400B" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={strokeWidth} fill="none" />
        <circle
          ref={ref}
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
