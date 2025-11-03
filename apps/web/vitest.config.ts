import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(__dirname, "..", "..", "packages");
const domainSrc = path.resolve(packagesDir, "domain", "src");
const applicationSrc = path.resolve(packagesDir, "application", "src");
const adaptersSrc = path.resolve(packagesDir, "adapters", "src");
const observabilitySrc = path.resolve(packagesDir, "observability", "src");
const appSrc = path.resolve(__dirname, "./src");

export default defineConfig(async () => {
  const react = (await import("@vitejs/plugin-react")).default;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@english-app/domain": domainSrc,
        "@english-app/domain/": `${domainSrc}/`,
        "@english-app/application": applicationSrc,
        "@english-app/application/": `${applicationSrc}/`,
        "@english-app/adapters": adaptersSrc,
        "@english-app/adapters/": `${adaptersSrc}/`,
        "@english-app/observability": observabilitySrc,
        "@english-app/observability/": `${observabilitySrc}/`,
        "@": appSrc,
        "@/": `${appSrc}/`,
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
    },
  };
});
