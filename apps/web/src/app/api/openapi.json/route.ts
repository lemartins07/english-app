import { NextResponse } from "next/server";

import { generateOpenAPIDocument } from "../../../server/openapi/document";

export const revalidate = 60;

export async function GET() {
  const document = generateOpenAPIDocument();

  return NextResponse.json(document, {
    headers: {
      "Cache-Control": "public, max-age=60",
    },
  });
}
