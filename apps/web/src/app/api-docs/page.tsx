"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import "swagger-ui-react/swagger-ui.css";

const SwaggerUIStandalone = dynamic(
  async () => {
    const [{ default: SwaggerUIComponent }, standalonePresetModule] = await Promise.all([
      import("swagger-ui-react"),
      import("swagger-ui/dist/swagger-ui-standalone-preset"),
    ]);

    const standalonePreset =
      (standalonePresetModule as { default?: unknown }).default ?? standalonePresetModule;

    type SwaggerUIProps = ComponentProps<typeof SwaggerUIComponent>;

    const basePresets = standalonePreset ? [standalonePreset] : [];

    const SwaggerUIStandaloneWrapper = (props: SwaggerUIProps) => {
      const combinedPresets = [
        ...basePresets,
        ...((props.presets ?? []) as unknown[]),
      ] as NonNullable<SwaggerUIProps["presets"]>;

      return (
        <SwaggerUIComponent
          {...props}
          layout={props.layout ?? "StandaloneLayout"}
          presets={combinedPresets}
        />
      );
    };

    return SwaggerUIStandaloneWrapper;
  },
  {
    ssr: false,
    loading: () => <div>Loading API documentation…</div>,
  },
);

export default function ApiDocsPage() {
  return (
    <main style={{ width: "100%", minHeight: "100vh" }}>
      <SwaggerUIStandalone url="/api/openapi.json" docExpansion="list" deepLinking />
    </main>
  );
}
