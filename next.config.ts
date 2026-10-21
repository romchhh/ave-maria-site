import type { NextConfig } from "next";

const nextConfig = {
  serverExternalPackages: ["pg", "sharp"],
  images: {
    formats: ["image/webp", "image/avif"],
    qualities: [75, 80, 85],
    deviceSizes: [384, 640, 750, 828, 1080, 1280, 1600],
    imageSizes: [48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
    optimizePackageImports: ["tailwind-merge"],
  },
  compress: true,
  poweredByHeader: false,
  trailingSlash: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/site.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
