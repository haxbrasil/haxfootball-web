import { describe, expect, it } from "vitest";
import { formatDateTime } from "./format-date-time";

describe("formatDateTime", () => {
  it("formats dates for Portuguese users", () => {
    expect(formatDateTime("2026-05-21T21:33:20.276Z")).toContain("2026");
  });

  it("uses a fallback for missing or invalid dates", () => {
    expect(formatDateTime(null)).toBe("Data não registrada");
    expect(formatDateTime("invalid", "-")).toBe("-");
  });
});
