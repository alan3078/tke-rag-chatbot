import dayjs from "dayjs";

export function normalizePublishedDate(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  const d = dayjs(value as string | Date | number);
  if (!d.isValid()) return null;

  return d.format("YYYY-MM-DD");
}

export function formatDate(value: Date | string | number | null | undefined, fmt = "YYYY-MM-DD"): string | null {
  if (value === null || value === undefined) return null;

  const d = dayjs(value);
  if (!d.isValid()) return null;

  return d.format(fmt);
}

