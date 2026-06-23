const JSON_CONTENT_TYPE = "application/json";
const DEFAULT_REQUEST_ERROR_MESSAGE = "Request failed";
const NETWORK_ERROR_MESSAGE = "Network error. Please try again.";

interface ApiErrorPayload {
  error: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return "error" in value && typeof value.error === "string";
}

async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function postJson<TResponse, TRequest>(
  input: string,
  body: TRequest,
): Promise<TResponse> {
  try {
    const response = await fetch(input, {
      method: "POST",
      headers: {
        "Content-Type": JSON_CONTENT_TYPE,
      },
      body: JSON.stringify(body),
    });

    const payload = await parseJsonSafely<TResponse | ApiErrorPayload>(response);

    if (!response.ok) {
      const message = isApiErrorPayload(payload) ? payload.error : DEFAULT_REQUEST_ERROR_MESSAGE;
      throw new ApiError(message, response.status);
    }

    if (payload === null) {
      throw new ApiError(DEFAULT_REQUEST_ERROR_MESSAGE, response.status);
    }

    return payload as TResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new Error(NETWORK_ERROR_MESSAGE);
  }
}
