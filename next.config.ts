import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Use remotePatterns instead of deprecated domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Disable image optimization for external images
    unoptimized: true,
  },
  // Move serverComponentsExternalPackages to the correct location
  serverExternalPackages: [],

  // Add empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;
