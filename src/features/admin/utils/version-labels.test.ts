import { describe, expect, it } from "vitest";
import { compareVersionLabelsDescending } from "./version-labels";

describe("compareVersionLabelsDescending", () => {
  it("orders prefixed versions by numeric semver parts with latest first", () => {
    const versions = ["v1.0.8", "v1.0.74", "v1.0.9", "v1.0.10"];

    expect([...versions].sort(compareVersionLabelsDescending)).toEqual([
      "v1.0.74",
      "v1.0.10",
      "v1.0.9",
      "v1.0.8",
    ]);
  });
});
