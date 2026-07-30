import { describe, expect, it } from "vitest";
import { isScorelessMatch } from "./match-list-filters";

describe("isScorelessMatch", () => {
  it("matches numeric and serialized zero scores", () => {
    expect(isScorelessMatch({ score: { red: 0, blue: 0 } })).toBe(true);
    expect(isScorelessMatch({ score: { red: "0", blue: "0" } })).toBe(true);
  });

  it("keeps matches with points or a pending score", () => {
    expect(isScorelessMatch({ score: { red: 1, blue: 0 } })).toBe(false);
    expect(isScorelessMatch({ score: null })).toBe(false);
    expect(isScorelessMatch({ score: { red: null, blue: null } })).toBe(false);
  });
});
