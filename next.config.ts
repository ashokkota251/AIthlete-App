import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dgalywyr863hv.cloudfront.net" }, // Strava avatar CDN
      { protocol: "https", hostname: "graph.strava.com" },
    ],
  },
};

export default nextConfig;
