import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Merchants paste `<script src=".../embed.js">` onto their own site;
      // the loader itself lives in the route handler at /api/embed.
      { source: '/embed.js', destination: '/api/embed' },
    ];
  },
  async headers() {
    return [
      {
        // The landing page is loaded inside an iframe on merchant sites by
        // the embed loader, so it must not be framed-denied.
        source: '/w/:slug',
        headers: [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }],
      },
    ];
  },
};

export default nextConfig;
