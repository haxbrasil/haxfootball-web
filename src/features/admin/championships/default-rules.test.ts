import { describe, expect, it } from "vitest";
import { defaultChampionshipRules } from "./default-rules";

describe("default championship rules", () => {
  it("keeps salary management opt-in", () => {
    expect(defaultChampionshipRules.salary.enabled).toBe(false);
  });
});
