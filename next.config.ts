import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both cacheComponents + partialPrefetching must be enabled together or both off
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
