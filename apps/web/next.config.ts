import type { NextConfig } from "next";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const swaggerUICssPath = require.resolve("swagger-ui-react/swagger-ui.css");

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {},
    },
  },
  webpack: (config) => {
    // Fallback to webpack bundler for packages that don't yet work with Turbopack (Swagger UI chain).
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias["swagger-ui-react/swagger-ui.css"] = swaggerUICssPath;

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
