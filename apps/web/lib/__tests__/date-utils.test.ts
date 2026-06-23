import { describe, expect, it } from "vitest";
import { normalizePublishedDate } from "@/lib/date-utils";

describe("normalizePublishedDate", () => {
  it("returns null for nullish values", () => {
    expect(normalizePublishedDate(null)).toBeNull();
    expect(normalizePublishedDate(undefined)).toBeNull();
  });

  it("formats Date instances as YYYY-MM-DD", () => {
    expect(normalizePublishedDate(new Date("2026-06-15T12:34:56Z"))).toBe("2026-06-15");
  });

  it("passes through existing YYYY-MM-DD strings", () => {
    expect(normalizePublishedDate("2026-06-15")).toBe("2026-06-15");
  });

  it("normalizes slash-separated strings", () => {
    expect(normalizePublishedDate("2026/06/15")).toBe("2026-06-15");
  });
});
