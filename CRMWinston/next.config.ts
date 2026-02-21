import type { NextConfig } from "next";

const strapiBaseUrl = process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${strapiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
