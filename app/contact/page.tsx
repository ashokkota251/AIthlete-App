import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Mail, Phone, Linkedin, Instagram } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact · AIthlete",
  description: "Get in touch with the person behind AIthlete.",
};

interface ContactRow {
  label: string;
  value: string;
  href: string;
  icon: React.ReactNode;
  /** Optional secondary text (handle, formatted number, etc.) */
  meta?: string;
  /** Should this open in a new tab? */
  external?: boolean;
}

const ROWS: ContactRow[] = [
  {
    label: "Email",
    value: "ashok.kota251@gmail.com",
    meta: "Fastest way to reach me",
    href: "mailto:ashok.kota251@gmail.com?subject=AIthlete%20%E2%80%94%20",
    icon: <Mail size={18} strokeWidth={2.1} />,
  },
  {
    label: "Phone",
    value: "+91 97000 86407",
    meta: "WhatsApp friendly",
    href: "tel:+919700086407",
    icon: <Phone size={18} strokeWidth={2.1} />,
  },
  {
    label: "LinkedIn",
    value: "/in/ashokkotaa",
    meta: "Work and product chats",
    href: "https://www.linkedin.com/in/ashokkotaa/",
    icon: <Linkedin size={18} strokeWidth={2.1} />,
    external: true,
  },
  {
    label: "Instagram",
    value: "@theashokkota",
    meta: "Behind the scenes",
    href: "https://www.instagram.com/theashokkota/",
    icon: <Instagram size={18} strokeWidth={2.1} />,
    external: true,
  },
];

export default function ContactPage() {
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
              Made by one human
            </span>
          </div>
          <h1 className="mt-4 font-display font-bold tracking-tight leading-[0.95] text-[52px] md:text-[68px] text-ink-900">
            Say hi
            <span className="text-coral">.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-700 max-w-[54ch]">
            AIthlete is built and maintained by one person — feedback, bug
            reports, feature ideas, partnership chats, or just hello, it all
            goes to me directly.
          </p>
        </header>

        <div className="mt-10 h-px bg-gradient-to-r from-coral/60 via-coral/20 to-transparent" />

        {/* author block — calling card */}
        <section
          className="mt-10 rise"
          style={{ animationDelay: "120ms" }}
          aria-label="Author"
        >
          <div className="flex items-center gap-5">
            <Monogram />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-ink-400">
                Builder &amp; Maintainer
              </div>
              <div className="mt-1 font-display font-bold text-[28px] md:text-[32px] tracking-tight leading-none text-ink-900">
                Ashok Kota
              </div>
              <div className="mt-2 text-[13px] leading-relaxed text-ink-600">
                Hyderabad, India
                <span className="mx-2 text-ink-300">·</span>
                Responds within a day
              </div>
            </div>
          </div>
        </section>

        {/* contact rows */}
        <section className="mt-10 space-y-3" aria-label="Contact methods">
          {ROWS.map((row, i) => (
            <a
              key={row.label}
              href={row.href}
              {...(row.external
                ? { target: "_blank", rel: "noreferrer noopener" }
                : {})}
              className="group block rise"
              style={{ animationDelay: `${180 + i * 70}ms` }}
            >
              <div className="relative card !p-0 overflow-hidden hover:shadow-elev transition-all duration-300">
                {/* hover sweep */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1 bg-coral scale-y-0 origin-center group-hover:scale-y-100 transition-transform duration-300"
                />
                <div className="flex items-center gap-5 px-5 py-5 md:px-6 md:py-6">
                  <span className="shrink-0 size-11 grid place-items-center rounded-[14px] bg-coral-50 text-coral-700 group-hover:bg-coral group-hover:text-white transition-colors duration-300">
                    {row.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase tracking-[0.22em] font-semibold text-ink-400">
                      {row.label}
                    </div>
                    <div className="mt-1 font-display font-semibold text-[18px] md:text-[20px] tracking-tight text-ink-900 truncate">
                      {row.value}
                    </div>
                    {row.meta && (
                      <div className="mt-0.5 text-[12px] text-ink-500 leading-snug">
                        {row.meta}
                      </div>
                    )}
                  </div>
                  <ArrowUpRight
                    size={18}
                    strokeWidth={2.2}
                    className="shrink-0 text-ink-300 group-hover:text-coral group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300"
                  />
                </div>
              </div>
            </a>
          ))}
        </section>

        {/* primary CTA — opens email with subject prefilled */}
        <section
          className="mt-10 rise"
          style={{ animationDelay: `${180 + ROWS.length * 70 + 40}ms` }}
        >
          <a
            href="mailto:ashok.kota251@gmail.com?subject=AIthlete%20%E2%80%94%20"
            className="group block relative overflow-hidden rounded-card"
          >
            <span
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(150deg, #F2541B 0%, #FF8A3D 100%)",
              }}
            />
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-1/2 opacity-50 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 100%)",
              }}
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-card pointer-events-none"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.18)",
              }}
            />
            <div className="relative flex items-center justify-between gap-4 px-6 py-5 text-white">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-white/80">
                  Drop a message
                </div>
                <div className="mt-1 font-display font-bold text-[20px] md:text-[22px] tracking-tight leading-tight">
                  Compose an email right now
                </div>
              </div>
              <span className="shrink-0 size-11 rounded-full bg-white/15 backdrop-blur grid place-items-center transition-transform group-hover:scale-110">
                <Mail size={18} strokeWidth={2.4} />
              </span>
            </div>
          </a>
        </section>

        {/* footer — cross-links to other static pages */}
        <div className="mt-14 pt-8 border-t border-ink-100 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] font-semibold text-ink-400">
          <Link href="/terms" className="hover:text-coral transition-colors">
            Terms
          </Link>
          <span className="nums">© AIthlete · 2026</span>
          <Link href="/privacy" className="hover:text-coral transition-colors">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Coral-on-cream monogram tile — feels like a sealed letterhead. */
function Monogram() {
  return (
    <span
      aria-hidden
      className="relative shrink-0 size-[74px] rounded-[20px] overflow-hidden grid place-items-center"
      style={{
        background:
          "radial-gradient(120% 120% at 80% 0%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(150deg, #F2541B 0%, #FF8A3D 100%)",
        boxShadow:
          "0 14px 34px -14px rgba(196,66,15,0.40), inset 0 1px 0 rgba(255,255,255,0.30)",
      }}
    >
      <span className="font-display font-bold text-white text-[30px] leading-none tracking-tight">
        AK
      </span>
      {/* hairline outer ring */}
      <span
        aria-hidden
        className="absolute -inset-1.5 rounded-[26px] border border-dashed border-coral/30"
      />
    </span>
  );
}

function DecorativeCorner() {
  return (
    <svg
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        right: "-180px",
        top: "-80px",
        width: "440px",
        height: "440px",
        opacity: 0.45,
      }}
      viewBox="0 0 440 440"
    >
      <defs>
        <linearGradient id="contact-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A4D" stopOpacity="0.7" />
          <stop offset="1" stopColor="#F2541B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle
        cx="220"
        cy="220"
        r="200"
        fill="none"
        stroke="url(#contact-ring)"
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
