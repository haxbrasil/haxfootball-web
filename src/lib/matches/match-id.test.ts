import { describe, expect, it } from "vitest";
import { normalizeMatchIdInput } from "./match-id";

describe("normalizeMatchIdInput", () => {
  it("strips hyphens and normalizes casing", () => {
    expect(normalizeMatchIdInput(" 9JAQ-FFDQ ")).toBe("9jaqffdq");
    expect(normalizeMatchIdInput("CV24-ATMD-P")).toBe("cv24atmdp");
  });
});
