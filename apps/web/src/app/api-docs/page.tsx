"use client";

import { useEffect, useRef } from "react";

import "swagger-ui/dist/swagger-ui.css";

const SWAGGER_CONTAINER_ID = "swagger-ui-container";

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const mountSwagger = async () => {
      if (!containerRef.current) return;

      const [swaggerModule, standalonePresetModule] = await Promise.all([
        import("swagger-ui"),
        import("swagger-ui/dist/swagger-ui-standalone-preset"),
      ]);

      const SwaggerUIBundle = swaggerModule.default;
      const apisPreset =
        SwaggerUIBundle?.presets?.apis ??
        (swaggerModule as typeof swaggerModule & { presets?: { apis?: unknown } }).presets?.apis;
      const SwaggerUIStandalonePreset =
        (standalonePresetModule as { default?: unknown }).default ?? standalonePresetModule;
      const presetEntries = [apisPreset, SwaggerUIStandalonePreset].filter(Boolean) as unknown[];

      const target = containerRef.current;
      target.innerHTML = "";

      if (typeof window !== "undefined") {
        const existing = (window as typeof window & { ui?: unknown }).ui;
        if (existing && typeof (existing as { destroy?: () => void }).destroy === "function") {
          try {
            (existing as { destroy: () => void }).destroy();
          } catch (error) {
            console.warn("Failed to destroy existing Swagger UI instance:", error);
          }
        }
        delete (window as typeof window & { ui?: unknown }).ui;
      }

      if (typeof SwaggerUIBundle !== "function") {
        throw new Error("Swagger UI module did not expose a callable export");
      }

      const instance = SwaggerUIBundle({
        dom_id: `#${SWAGGER_CONTAINER_ID}`,
        url: "/api/openapi.json",
        docExpansion: "list",
        deepLinking: true,
        presets: presetEntries,
        layout: "StandaloneLayout",
      });

      if (typeof window !== "undefined") {
        (window as typeof window & { ui?: unknown }).ui = instance;
      }

      cleanup = () => {
        if (instance && typeof instance.destroy === "function") {
          instance.destroy();
        }
        target.innerHTML = "";
        if (typeof window !== "undefined") {
          delete (window as typeof window & { ui?: unknown }).ui;
        }
      };
    };

    mountSwagger().catch((error: unknown) => {
      console.warn("Failed to initialise Swagger UI:", error);
    });

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <div
      id={SWAGGER_CONTAINER_ID}
      ref={containerRef}
      style={{ width: "100%", minHeight: "100vh" }}
    />
  );
}
