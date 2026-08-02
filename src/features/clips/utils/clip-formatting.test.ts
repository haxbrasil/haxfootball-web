import { describe, expect, it } from "vitest";
import {
  clipFormatLabel,
  formatClipDuration,
  formatClipRange,
  formatClipTime,
} from "./clip-formatting";

describe("clip formatting", () => {
  it("formats replay ticks as match time at 60 frames per second", () => {
    expect(formatClipTime(0)).toBe("0:00");
    expect(formatClipTime(75 * 60)).toBe("1:15");
    expect(formatClipRange(10 * 60, 25 * 60)).toBe("0:10 – 0:25");
    expect(formatClipDuration(10 * 60, 25 * 60)).toBe("0:15");
  });

  it("uses HBR2 as the compatibility label when format metadata is missing", () => {
    expect(clipFormatLabel("hbrx")).toBe("HBRX");
    expect(clipFormatLabel(null)).toBe("HBR2");
  });
});
