import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.localhost"],
  images: {
    localPatterns: [
      { pathname: "/brand/**" },
      { pathname: "/demo/**" },
      { pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
