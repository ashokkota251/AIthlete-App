import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface LegalSection {
  /** Section heading (e.g. "What AIthlete is") */
  title: string;
  /** Plain-text or JSX body. Strings render as one paragraph. */
  body: React.ReactNode;
}

interface LegalLayoutProps {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  lede: string;
  sections: LegalSection[];
  /** Footer fineprint shown below the last section (small, ink-400). */
  footer?: React.ReactNode;
}

/**
 * Editorial-magazine layout for the static legal pages.
 * The aesthetic deliberately rejects the sterile "legal page" cliché:
 *  – Heavy display title with a coral period to match the brand wordmark.
 *  – Numbered sections (01, 02, …) set in tabular display numerals, oversized
 *    and pulled into the gutter on tablet+ so they read like an article.
 *  – Thin coral hairline rules between sections.
 *  – Atmospheric decorative ring in the upper-right corner echoes the
 *    sign-in screen so the page feels like part of the product, not a
 *    boilerplate /legal slug.
 */
export function LegalLayout({
  eyebrow,
  title,
  effectiveDate,
  lede,
  sections,
  footer,
}: LegalLayoutProps) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <DecorativeCorner />

      <div className="relative z-10 mx-auto w-full max-w-[720px] px-5 md:px-10 pt-6 pb-16">
        {/* back link */}
        <Link
          href="/signin"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] font-semibold text-ink-500 hover:text-coral transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2.4} />
          Back to sign in
        </Link>

        {/* masthead */}
        <header className="mt-9 rise">
          <div className="flex items-center gap-3">
            <span className="h-px w-9 bg-coral" />
            <span className="text-[10px] uppercase tracking-[0.32em] font-semibold text-coral">
              {eyebrow}
            </span>
          </div>
          <h1 className="mt-4 font-display font-bold tracking-tight leading-[0.95] text-[52px] md:text-[68px] text-ink-900">
            {title}
            <span className="text-coral">.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-700 max-w-[58ch]">
            {lede}
          </p>
          <div className="mt-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] font-semibold text-ink-400 nums">
            <span>Effective {effectiveDate}</span>
            <span className="size-1 rounded-full bg-ink-300" aria-hidden />
            <span>v1.0</span>
          </div>
        </header>

        <div className="mt-10 h-px bg-gradient-to-r from-coral/60 via-coral/20 to-transparent" />

        {/* sections */}
        <main className="mt-10 space-y-12">
          {sections.map((s, i) => (
            <section key={i} className="rise" style={{ animationDelay: `${120 + i * 60}ms` }}>
              <div className="grid grid-cols-[auto_1fr] gap-x-5 md:gap-x-8 items-start">
                <div className="font-display font-bold text-[28px] md:text-[34px] leading-none text-coral/30 nums tabular-nums select-none">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-bold tracking-tight text-[20px] md:text-[22px] text-ink-900 leading-tight">
                    {s.title}
                  </h2>
                  <div className="mt-3 prose-legal text-[14.5px] leading-[1.75] text-ink-700">
                    {typeof s.body === "string" ? <p>{s.body}</p> : s.body}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </main>

        {footer && (
          <footer className="mt-16 pt-8 border-t border-ink-100 text-[12px] leading-relaxed text-ink-500">
            {footer}
          </footer>
        )}

        <div className="mt-12 flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.28em] font-semibold text-ink-400">
          <Link href="/terms" className="hover:text-coral transition-colors">
            Terms
          </Link>
          <Link
            href="/contact"
            className="hover:text-coral transition-colors flex items-center gap-1.5"
          >
            <span className="size-1 rounded-full bg-coral" aria-hidden />
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-coral transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}

function DecorativeCorner() {
  return (
    <svg
      aria-hidden
      className="absolute pointer-events-none"
      style={{ right: "-180px", top: "-80px", width: "440px", height: "440px", opacity: 0.45 }}
      viewBox="0 0 440 440"
    >
      <defs>
        <linearGradient id="legal-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A4D" stopOpacity="0.7" />
          <stop offset="1" stopColor="#F2541B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle
        cx="220"
        cy="220"
        r="200"
        fill="none"
        stroke="url(#legal-ring)"
        strokeWidth="1.5"
        strokeDasharray="2 6"
      />
      <circle
        cx="220"
        cy="220"
        r="170"
        fill="none"
        stroke="#F2541B"
        strokeOpacity="0.16"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray="340 700"
        transform="rotate(-100 220 220)"
      />
    </svg>
  );
}
