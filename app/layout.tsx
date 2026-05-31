import type { Metadata, Viewport } from "next";
import "./globals.css";
import { display, body } from "./fonts";

export const metadata: Metadata = {
  title: "AIthlete · AI Training Companion",
  description:
    "An AI-powered training companion for athletes. One-tap Strava sign-in, weekly intelligence, and a coach that actually pays attention to your numbers.",
  icons: {
    icon: "/aithlete-icon.svg",
    apple: "/aithlete-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FBF5F0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans">
        {/* Atmospheric background — coral gradient mesh extends behind the column
            on tablet/desktop so the centred app feels intentional, not orphaned. */}
        <div className="app-bg" aria-hidden />
        {/* App column.
            Phone: edge-to-edge, full height, no chrome.
            Tablet+: 560px centred, flush to bottom so the fixed BottomNav
            (which uses the same --app-max) lines up with the column edges.
            Rounded top + coral-tinted shadow makes it a "card on a desk". */}
        <div className="relative z-10 mx-auto w-full max-w-[var(--app-max)] min-h-[100dvh] md:bg-cream md:rounded-t-[36px] md:mt-8 md:min-h-[calc(100dvh-32px)] md:shadow-[0_-1px_0_0_rgba(242,84,27,0.10),0_30px_90px_-30px_rgba(80,30,10,0.30)]">
          {children}
        </div>
      </body>
    </html>
  );
}
