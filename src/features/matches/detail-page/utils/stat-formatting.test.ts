import { describe, expect, it } from "vitest";
import { formatStatValue } from "./stat-formatting";

describe("formatStatValue", () => {
  it("formats primitive stat values", () => {
    expect(formatStatValue(null)).toBe("-");
    expect(formatStatValue(undefined)).toBe("-");
    expect(formatStatValue(3)).toBe("3");
    expect(formatStatValue(3.14159)).toBe("3.14");
    expect(formatStatValue("touchdown")).toBe("touchdown");
    expect(formatStatValue(true)).toBe("true");
  });

  it("serializes structured stat values", () => {
    expect(formatStatValue({ yards: 12 })).toBe('{"yards":12}');
  });
});
