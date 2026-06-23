export function normalizePublishedDate(value: Date | string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value.toISOString().split("T")[0];
  }

  const normalizedValue = value.replaceAll("/", "-");
  const parsed = new Date(normalizedValue);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().split("T")[0];
}
