import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { generateOpenAPIDocument } from "../src/server/openapi/document";

async function main() {
  const outDir = resolve(process.cwd(), "apps/web/.openapi");
  const outFile = resolve(outDir, "openapi.json");
  const document = generateOpenAPIDocument();

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, JSON.stringify(document, null, 2));

  console.log(`OpenAPI spec written to ${outFile}`);
}

void main();
