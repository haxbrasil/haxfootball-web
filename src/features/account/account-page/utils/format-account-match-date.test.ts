import { describe, expect, it } from "vitest";
import { formatAccountMatchDate } from "./format-account-match-date";

describe("formatAccountMatchDate", () => {
  it("formats match dates in Portuguese", () => {
    expect(formatAccountMatchDate("2026-05-21T14:30:00.000Z")).toContain("2026");
  });

  it("handles invalid dates", () => {
    expect(formatAccountMatchDate("invalid")).toBe("Data não registrada");
  });
});
