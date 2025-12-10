import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "build",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'plugins.socigy.com',
      },
      {
        protocol: 'https',
        hostname: 'images.socigy.com',
      },
      {
        protocol: 'https',
        hostname: 'videos.socigy.com',
      },
      {
        protocol: 'https',
        hostname: 'audios.socigy.com',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Required for modern module handling
    // esmExternals: 'loose',
    // Optional but recommended
    externalDir: true
  }
};

export default nextConfig;
