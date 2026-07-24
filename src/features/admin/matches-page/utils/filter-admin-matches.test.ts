import { describe, expect, it } from "vitest";
import { filterAdminMatches } from "./filter-admin-matches";

const matches = [
  {
    id: "abcd2345",
    kind: "single" as const,
    status: "finished",
  },
  {
    id: "wxyz6789",
    kind: "composed" as const,
    status: "in-progress",
  },
];

describe("filterAdminMatches", () => {
  it("returns the complete inventory for an empty query", () => {
    expect(filterAdminMatches(matches, "  ")).toEqual(matches);
  });

  it("finds matches by public ID and status", () => {
    expect(filterAdminMatches(matches, "CD23")).toEqual([matches[0]]);
    expect(filterAdminMatches(matches, "in-progress")).toEqual([matches[1]]);
  });

  it("finds individual and composed resource types", () => {
    expect(filterAdminMatches(matches, "individual")).toEqual([matches[0]]);
    expect(filterAdminMatches(matches, "composta")).toEqual([matches[1]]);
    expect(filterAdminMatches(matches, "vínculo")).toEqual([matches[1]]);
  });
});
