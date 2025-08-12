import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* keep builds strict to catch issues early */
  eslint: {
    ignoreDuringBuilds: false,
  },
  reactStrictMode: true,
};

export default nextConfig;
