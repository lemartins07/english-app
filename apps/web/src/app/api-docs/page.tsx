"use client";

import dynamic from "next/dynamic";

import "./swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => <div>Loading API documentation…</div>,
});

export default function ApiDocsPage() {
  return (
    <main style={{ width: "100%", minHeight: "100vh" }}>
      <SwaggerUI
        url="/api/openapi.json"
        docExpansion="list"
        deepLinking
        layout="StandaloneLayout"
      />
    </main>
  );
}
