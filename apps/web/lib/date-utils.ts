export function normalizePublishedDate(value: Date | string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return value.replaceAll("/", "-");
}
