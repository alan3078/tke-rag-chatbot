import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "path";

loadEnvConfig(path.resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["typeorm", "pg", "nodejieba", "reflect-metadata"],
};

export default nextConfig;
