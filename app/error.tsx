"use client";

import { useEffect } from "react";
import { AithleteIcon } from "@/components/aithlete-icon";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AIthlete error]", error);
  }, [error]);

  return (
    <div
      className="relative flex flex-col items-center justify-center px-6 pt-10 pb-8 overflow-hidden"
      style={{ height: "100dvh", minHeight: "100dvh" }}
    >
      <div className="rounded-[28px] overflow-hidden shadow-elev mb-6">
        <AithleteIcon size={88} />
      </div>

      <h1
        className="text-ink-900 text-3xl leading-none mb-3"
        style={{
          fontFamily: "var(--font-display)",
          fontVariationSettings: '"opsz" 96, "wdth" 90, "wght" 700',
          letterSpacing: "-0.03em",
        }}
      >
        Something went sideways<span className="text-coral">.</span>
      </h1>

      <p className="text-[13px] text-ink-500 text-center max-w-[36ch] mb-2">
        We hit a snag while loading this view. Try again — most of the time it
        clears itself.
      </p>

      {error?.digest && (
        <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-ink-400 nums mb-6">
          Ref · {error.digest}
        </p>
      )}

      <div className="flex flex-col gap-3 w-full max-w-[300px] mt-2">
        <button onClick={reset} className="btn-primary w-full">
          Try again
        </button>
        <a href="/signin" className="btn-ghost w-full">
          Back to sign in
        </a>
      </div>
    </div>
  );
}
