import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Cache Components / partial prerendering are off: OpenNext on Cloudflare Workers doesn't support them yet
  // (requests hang). Store pages fetch fresh data on every request either way.
  // Cloudflare Workers have no built-in image optimizer; product photos are already sized and cached.
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The browser talks to the API on the same origin, so the admin auth cookie stays first-party.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
      { source: "/uploads/:path*", destination: `${API_URL}/api/uploads/:path*` },
    ];
  },
};

export default nextConfig;
