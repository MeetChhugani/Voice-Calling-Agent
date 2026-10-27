import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: cacheComponents + partialPrefetching removed — incompatible with
  // force-dynamic API routes. Use unstable_noStore() per-route instead.
};

export default nextConfig;
