import type { NextConfig } from "next";

const SUPABASE_URL = "eguntjnubbfuzglqwdhb.supabase.co";
const VERCEL_URL = "ocio-virid.vercel.app";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_URL,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              `default-src 'self' https://${VERCEL_URL} capacitor://localhost`,
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://${VERCEL_URL}`,
              `style-src 'self' 'unsafe-inline'`,
              `img-src 'self' data: blob: https://${SUPABASE_URL} https://*.tile.openstreetmap.org https://*.openstreetmap.org`,
              `connect-src 'self' https://${VERCEL_URL} https://${SUPABASE_URL} wss://${SUPABASE_URL} https://nominatim.openstreetmap.org https://fcm.googleapis.com`,
              `font-src 'self' data:`,
              `media-src 'self' blob: https://${SUPABASE_URL}`,
              `frame-ancestors 'none'`,
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
