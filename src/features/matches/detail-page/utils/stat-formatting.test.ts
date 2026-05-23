import { describe, expect, it } from "vitest";
import { formatStatValue } from "./stat-formatting";

describe("formatStatValue", () => {
  it("formats primitive stat values", () => {
    expect(formatStatValue(null)).toBe("-");
    expect(formatStatValue(undefined)).toBe("-");
    expect(formatStatValue(3)).toBe("3");
    expect(formatStatValue(3.14159)).toBe("3.14");
    expect(formatStatValue("touchdown")).toBe("touchdown");
    expect(formatStatValue(true)).toBe("Sim");
  });

  it("formats structured stat values without leaking JSON", () => {
    expect(formatStatValue({ source: "KICKOFF_RETURN", team: 2, yards: 12 })).toBe(
      "12 jardas · time: azul",
    );
  });

  it("formats nested field positions", () => {
    expect(
      formatStatValue({
        endFieldPosition: { side: 1, yards: 26 },
        startFieldPosition: { side: 2, yards: 1 },
      }),
    ).toBe("início: lado 2, 1 jarda · fim: lado 1, 26 jardas");
  });
});
