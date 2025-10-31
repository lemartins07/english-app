import { z } from "zod";

import { ApiRequestError } from "./errors";

const echoRequestSchema = z.object({
  message: z.string().min(1, "Mensagem não pode ser vazia."),
});

const echoResponseSchema = z.object({
  message: z.string(),
  receivedAt: z.string().min(1),
});

const errorResponseSchema = z.object({
  error: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type EchoResponse = z.infer<typeof echoResponseSchema>;

function parseJson(text: string, status: number) {
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiRequestError("Resposta inválida do endpoint /api/echo.", {
      status,
      body: text,
    });
  }
}

export async function sendEchoMessage(
  message: string,
  options: { signal?: AbortSignal } = {},
): Promise<EchoResponse> {
  const payload = echoRequestSchema.parse({ message });

  const response = await fetch("/api/echo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  const rawBody = await response.text();
  const data = parseJson(rawBody, response.status);

  if (!response.ok) {
    const parsedError = data ? errorResponseSchema.safeParse(data) : null;
    const message =
      parsedError && parsedError.success
        ? parsedError.data.error
        : `Falha ao enviar mensagem para o tutor (status ${response.status}).`;

    throw new ApiRequestError(message, { status: response.status, body: data });
  }

  const parsed = echoResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new ApiRequestError("Estrutura de resposta inesperada do tutor.", {
      status: response.status,
      body: data,
    });
  }

  return parsed.data;
}
