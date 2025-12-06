import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;
