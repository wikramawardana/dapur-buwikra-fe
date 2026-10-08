import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict mode to prevent double API calls in development
  reactStrictMode: false,
  // Enable standalone output for Docker deployment
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.wikra.cloud",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.cuwi.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cuwi.app",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
