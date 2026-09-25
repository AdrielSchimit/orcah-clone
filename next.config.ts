import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.localhost"],
  turbopack: {
    root: process.cwd(),
  },
  images: {
    localPatterns: [
      { pathname: "/brand/**" },
      { pathname: "/demo/**" },
      { pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
