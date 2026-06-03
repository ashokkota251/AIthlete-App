import type { Metadata, Viewport } from "next";
import "./globals.css";
import { display, body } from "./fonts";

export const metadata: Metadata = {
  title: "AIthlete · AI Training Companion",
  description:
    "An AI-powered training companion for athletes. One-tap Strava sign-in, weekly intelligence, and a coach that actually pays attention to your numbers.",
  applicationName: "AIthlete",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", rel: "icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "AIthlete",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2541B" },
    { media: "(prefers-color-scheme: dark)", color: "#F2541B" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans" suppressHydrationWarning>
        {/* Phone: max-w-[480px] column, edge-to-edge on small viewports.
            Tablet+: full-bleed — the app takes the whole iPad/desktop width.
            Inner pages handle their own readable content widths. */}
        <div className="mx-auto w-full max-w-[var(--app-max)] min-h-[100dvh]">
          {children}
        </div>
      </body>
    </html>
  );
}
