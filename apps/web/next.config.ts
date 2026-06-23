import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["typeorm", "pg", "nodejieba", "reflect-metadata"],
};

export default nextConfig;
