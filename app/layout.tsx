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
        <div className="relative z-10 mx-auto w-full max-w-[var(--app-max)] min-h-[100dvh]">
          {children}
        </div>
      </body>
    </html>
  );
}
