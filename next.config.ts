import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'prisma', 'pg'],
  // Turbopack configuration for Prisma compatibility
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.extensionAlias = {
        '.js': ['.ts', '.tsx', '.js', '.jsx'],
        '.mjs': ['.mts', '.mjs'],
        '.cjs': ['.cts', '.cjs'],
      };
    }
    return config;
  },
};

export default nextConfig;
