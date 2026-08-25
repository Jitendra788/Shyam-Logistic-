import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 70, 75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1400, 1920],
    imageSizes: [32, 48, 64, 96, 128, 192, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  outputFileTracingIncludes: {
    "/api/tbs/bookings/lr-pdf": [
      "./public/brand/lr-form-blank.pdf",
      "./public/brand/shyam-peacock-mark-print.png",
      "./public/brand/shyam-peacock-mark.png",
    ],
    "/api/:path*": [
      "./public/brand/lr-form-blank.pdf",
      "./public/brand/shyam-peacock-mark-print.png",
      "./src/lib/tbs/assets/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
      {
        source: "/api/tbs/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
