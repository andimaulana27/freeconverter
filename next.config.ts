import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      fs: "./src/shims/empty-module.js",
      path: "./src/shims/empty-module.js",
    },
  },
};

export default nextConfig;
