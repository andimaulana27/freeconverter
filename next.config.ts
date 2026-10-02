import type { NextConfig } from "next";
import path from "node:path";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const utifFile = path.join(process.cwd(), "node_modules/utif/UTIF.js");
const pakoFile = path.join(process.cwd(), "node_modules/pako/index.js");

export default function config(phase: string): NextConfig {
  const development = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    reactStrictMode: true,
    poweredByHeader: false,
    distDir: development ? ".next-dev" : ".next",
    allowedDevOrigins: ["127.0.0.1"],
    transpilePackages: ["pdfjs-dist", "utif", "mammoth", "pako"],
    webpack: (webpackConfig, { isServer }) => {
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        utif: utifFile,
        pako: pakoFile,
      };
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
        utif: "./node_modules/utif/UTIF.js",
        pako: "./node_modules/pako/index.js",
      },
    },
  };
}
