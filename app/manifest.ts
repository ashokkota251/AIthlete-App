import type { MetadataRoute } from "next";

/**
 * PWA manifest — makes the app installable to home screen on iOS/Android
 * with a fullscreen, branded launch. No service worker (yet) — this is the
 * "installable shell" tier; offline behavior comes later if we want it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AIthlete · AI Training Companion",
    short_name: "AIthlete",
    description:
      "An AI-powered training companion for athletes. Strava-connected, " +
      "daily intelligence, a coach that pays attention to your numbers.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#F2541B",
    background_color: "#FBF5F0",
    icons: [
      // SVG handles "any" purpose — crisp at every size, no OS cropping.
      {
        src: "/aithlete-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      // PNGs are the maskable set from realfavicongenerator (safe-zone padded).
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["fitness", "health", "lifestyle", "sports"],
  };
}
