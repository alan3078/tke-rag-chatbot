import dayjs from "dayjs";

export function formatDate(value: Date | string | number | null | undefined, fmt = "YYYY-MM-DD"): string | null {
  if (value === null || value === undefined) return null;

  const d = dayjs(value);
  if (!d.isValid()) return null;

  return d.format(fmt);
}

export function normalizePublishedDate(value: Date | string | null | undefined): string | null {
  return formatDate(value, "YYYY-MM-DD");
}

export function now(): string {
  return dayjs().toISOString();
}

export function isBefore(a: Date | string, b: Date | string): boolean {
  return dayjs(a).isBefore(dayjs(b));
}

export function isAfter(a: Date | string, b: Date | string): boolean {
  return dayjs(a).isAfter(dayjs(b));
}
