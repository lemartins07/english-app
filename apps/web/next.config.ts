import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@english-app/domain",
    "@english-app/application",
    "@english-app/adapters",
    "@english-app/observability",
    "@english-app/ui",
    "swagger-ui-react",
  ],
};

export default nextConfig;
