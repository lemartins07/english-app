export class ApiRequestError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(message: string, options: { status: number; body?: unknown }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.body = options.body;
  }
}
