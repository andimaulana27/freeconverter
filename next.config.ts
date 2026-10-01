import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  const development = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    reactStrictMode: true,
    poweredByHeader: false,
    distDir: development ? ".next-dev" : ".next",
    allowedDevOrigins: ["127.0.0.1"],
    transpilePackages: ["pdfjs-dist", "utif", "mammoth"],
    webpack: (webpackConfig, { isServer }) => {
      if (!isServer) {
        webpackConfig.resolve.fallback = {
          ...webpackConfig.resolve.fallback,
          fs: false,
          path: false,
        };
      }
      return webpackConfig;
    },
    turbopack: {
      resolveAlias: {
        fs: { browser: "./src/shims/empty-module.js" },
        path: { browser: "./src/shims/empty-module.js" },
      },
    },
  };
}
