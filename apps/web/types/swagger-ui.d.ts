declare module "swagger-ui" {
  type DocExpansion = "list" | "full" | "none";

  interface SwaggerUIOptions {
    url?: string;
    spec?: Record<string, unknown>;
    domNode?: HTMLElement;
    dom_id?: string;
    docExpansion?: DocExpansion;
    deepLinking?: boolean;
    presets?: unknown[];
    layout?: string;
  }

  interface SwaggerUIInstance {
    destroy?: () => void;
  }

  interface SwaggerUIPresets {
    apis?: unknown[];
    [key: string]: unknown;
  }

  interface SwaggerUIStatic {
    (options: SwaggerUIOptions): SwaggerUIInstance;
    presets?: {
      apis?: unknown[];
      [key: string]: unknown;
    };
  }

  export const presets: {
    apis?: unknown[];
    [key: string]: unknown;
  };

  const defaultExport: SwaggerUIStatic;
  export default defaultExport;
}

declare module "swagger-ui/dist/swagger-ui-standalone-preset" {
  const SwaggerUIStandalonePreset: unknown;
  export default SwaggerUIStandalonePreset;
}
