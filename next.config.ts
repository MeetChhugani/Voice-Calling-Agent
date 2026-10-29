import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  // Note: cacheComponents + partialPrefetching removed — incompatible with
  // force-dynamic API routes. Use unstable_noStore() per-route instead.
};

export default nextConfig;
