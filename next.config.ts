import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@mastra/core", "@copilotkit/runtime"],
};

export default nextConfig;
