import { describe, expect, it } from "vitest";
import { buildRecordedSlots, rebuildRecordedSlots } from "./recorded-draft-studio-model";

describe("recorded draft studio model", () => {
  it("builds a complete serpentine grid with stable sequence numbers", () => {
    const slots = buildRecordedSlots(["a", "b", "c"], 2, null);

    expect(slots.map((slot) => [slot.sequence, slot.round, slot.position, slot.teamId])).toEqual([
      [1, 1, 1, "a"],
      [2, 1, 2, "b"],
      [3, 1, 3, "c"],
      [4, 2, 1, "c"],
      [5, 2, 2, "b"],
      [6, 2, 3, "a"],
    ]);
  });

  it("preserves known choices when the order or number of rounds changes", () => {
    const current = buildRecordedSlots(["a", "b"], 2, null).map((slot) =>
      slot.sequence === 2
        ? { ...slot, participantId: "p1", resolution: "selected" as const }
        : slot,
    );

    const rebuilt = rebuildRecordedSlots(["b", "a"], 3, current);

    expect(rebuilt.find((slot) => slot.round === 1 && slot.teamId === "b")).toMatchObject({
      participantId: "p1",
      resolution: "selected",
    });
    expect(rebuilt).toHaveLength(6);
  });
});
