import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy PostHog through our own domain to avoid ad blockers
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  // Required to prevent /ingest from being handled by Next.js
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
