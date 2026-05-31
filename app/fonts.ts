import { Space_Grotesk, DM_Sans } from "next/font/google";

/**
 * Display — Space Grotesk. Headings, big stats, eyebrows, logo.
 * Carries the brand edge with its open numerals + retro-future character.
 * Caps at 700; anywhere a design says 800, render 700.
 */
export const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

/**
 * Body — DM Sans. Paragraphs, UI labels, captions, buttons.
 * Low-contrast geometric — keeps body text legible so Space Grotesk's
 * personality doesn't tire the reader.
 */
export const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});
