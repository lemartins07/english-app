import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {},
    },
  },
  webpack: (config) => {
    return config;
  },
  transpilePackages: [
    "@english-app/domain",
    "@english-app/application",
    "@english-app/adapters",
    "@english-app/observability",
    "@english-app/ui",
    "swagger-ui-react",
    "@swagger-api/apidom-core",
    "@swagger-api/apidom-ns-openapi-3-0",
    "@swagger-api/apidom-ns-openapi-3-1",
    "@swagger-api/apidom-parser",
  ],
};

export default nextConfig;
