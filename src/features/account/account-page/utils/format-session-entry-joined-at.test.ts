import { describe, expect, it } from "vitest";
import { formatSessionEntryJoinedAt } from "./format-session-entry-joined-at";

describe("formatSessionEntryJoinedAt", () => {
  it("formats the session entry creation date", () => {
    expect(formatSessionEntryJoinedAt("2026-05-21T14:30:00.000Z")).toContain("Sessão iniciada em");
  });

  it("handles invalid dates", () => {
    expect(formatSessionEntryJoinedAt("not-a-date")).toBe("Sessão iniciada em data desconhecida");
  });
});
