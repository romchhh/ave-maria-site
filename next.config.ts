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
  async rewrites() {
    // beforeFiles: always serve product uploads via API so runtime writes
    // appear without restart (Next static /public can lag on new files).
    return {
      beforeFiles: [
        {
          source: "/assets/products/:path*",
          destination: "/api/media/products/:path*",
        },
        {
          source: "/assets/hero/:path*",
          destination: "/api/media/hero/:path*",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        // Brand / static marketing assets — long cache
        source: "/assets/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Other assets under /assets (not products/hero)
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Overrides /assets/:path* — uploads change often
        source: "/assets/products/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/assets/hero/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=86400",
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
