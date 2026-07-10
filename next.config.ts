import type { NextConfig } from "next";

const apiOrigin = (process.env.PROJECT_OS_API_INTERNAL_URL ?? 'http://127.0.0.1:18080').replace(/\/$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Allow popup-to-opener communication for Firebase Auth OAuth popup flow
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
