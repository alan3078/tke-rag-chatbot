const JSON_CONTENT_TYPE = "application/json";
const NETWORK_ERROR_MESSAGE = "Network error. Please try again.";

export type ErrorCode = string;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: ErrorCode,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const ERROR_I18N_MAP: Record<string, string> = {
  F0001: "error.auth.invalidCredentials",
  F0002: "error.auth.sessionRequired",
  F0003: "error.validation.failed",
  F0004: "error.validation.missingField",
  F0005: "error.chat.noResults",
  F0006: "error.chat.llmFailure",
  F0007: "error.server.internal",
  F0008: "error.server.embeddingDown",
  F0009: "error.rateLimit.tooMany",
  F0010: "error.chat.sessionNotFound",
};

function getErrorCode(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) return undefined;
  const obj = payload as Record<string, unknown>;
  if ("code" in obj && typeof obj.code === "string") return obj.code;
  return undefined;
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(input, init);

    let payload: unknown = null;
    try { payload = await response.json(); } catch { /* ignore */ }

    if (!response.ok) {
      const code = getErrorCode(payload);
      throw new ApiError(code ?? "UNKNOWN", response.status, code);
    }

    if (payload === null) {
      throw new ApiError("EMPTY", response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
}

export async function postJson<TResponse, TRequest>(
  input: string,
  body: TRequest,
): Promise<TResponse> {
  return request<TResponse>(input, {
    method: "POST",
    headers: { "Content-Type": JSON_CONTENT_TYPE },
    body: JSON.stringify(body),
  });
}

export async function getJson<T>(input: string): Promise<T> {
  return request<T>(input);
}

export async function patchJson<TResponse, TRequest>(
  input: string,
  body: TRequest,
): Promise<TResponse> {
  return request<TResponse>(input, {
    method: "PATCH",
    headers: { "Content-Type": JSON_CONTENT_TYPE },
    body: JSON.stringify(body),
  });
}

export async function deleteRequest<T>(input: string): Promise<T> {
  return request<T>(input, { method: "DELETE" });
}
