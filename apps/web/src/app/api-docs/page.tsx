"use client";

import dynamic from "next/dynamic";
import type { SwaggerUIProps } from "swagger-ui-react";

import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic<SwaggerUIProps>(() => import("swagger-ui-react"), {
  ssr: false,
});

export default function ApiDocsPage() {
  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      <SwaggerUI url="/api/openapi.json" docExpansion="list" />
    </div>
  );
}
