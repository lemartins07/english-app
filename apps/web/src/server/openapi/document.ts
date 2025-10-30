import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import "../../app/api/echo/route";
import "../../app/api/health/route";
import "./ai";

import { registry } from "./registry";

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "English App BFF API",
      version: "0.1.0",
      description:
        "OpenAPI documentation for the English App BFF. The spec is generated automatically from Zod schemas.",
      contact: {
        name: "English App Team",
        url: "https://github.com/lemartins07",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development",
      },
    ],
    tags: [
      { name: "Health", description: "System health and readiness endpoints." },
      { name: "Utility", description: "Auxiliary endpoints for testing and examples." },
      { name: "AI", description: "AI-powered endpoints for plans, assessments and chat." },
    ],
  });
}
