import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 70, 75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1400, 1920],
    imageSizes: [32, 48, 64, 96, 128, 192, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
