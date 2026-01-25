import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ipfs.w3s.link",
      },
      {
        protocol: "https",
        hostname: "**.nft.storage",
      },
    ],
  },
  experimental: {
    esmExternals: true,
  },
};

export default nextConfig;
