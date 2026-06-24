const DEFAULT_DEV_ORIGIN = "http://localhost:3000";

export function getCorsAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (raw) {
    return raw.split(",").map((origin) => origin.trim()).filter(Boolean);
  }

  return [DEFAULT_DEV_ORIGIN];
}
