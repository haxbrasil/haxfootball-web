import { describe, expect, it } from "vitest";
import {
  countdownLabel,
  numberValue,
  participantSearch,
  projectedTeamCap,
  roundDirection,
  secondsUntil,
  teamCapPercent,
  tradeBalance,
} from "./draft-workspace-model";

describe("draft workspace model", () => {
  it.each([
    [null, 0],
    [undefined, 0],
    ["18", 18],
    [18, 18],
    ["invalid", 0],
  ])("normalizes API number %j as %d", (value, expected) => {
    expect(numberValue(value)).toBe(expected);
  });

  it.each([
    [0, "00:00"],
    [9, "00:09"],
    [60, "01:00"],
    [125, "02:05"],
    [null, "Sem cronômetro"],
  ])("renders countdown %j", (seconds, expected) => {
    expect(countdownLabel(seconds)).toBe(expected);
  });

  it.each(Array.from({ length: 100 }, (_, index) => index + 1))(
    "alternates serpentine direction for round %d",
    (round) => {
      expect(roundDirection(round)).toBe(round % 2 === 0 ? "reverse" : "forward");
    },
  );

  it("uses server time and clamps expired deadlines", () => {
    expect(secondsUntil("2026-08-01T12:00:30.000Z", Date.parse("2026-08-01T12:00:00.000Z"))).toBe(
      30,
    );
    expect(secondsUntil("2026-08-01T11:59:00.000Z", Date.parse("2026-08-01T12:00:00.000Z"))).toBe(
      0,
    );
    expect(secondsUntil(null, Date.now())).toBeNull();
  });

  it.each([
    [0, 100, 0],
    [50, 100, 50],
    [150, 100, 100],
    [-20, 100, 0],
    [40, 0, 0],
  ])("clamps team cap visualization", (usageUnits, capUnits, expected) => {
    expect(teamCapPercent(team({ usageUnits }), capUnits)).toBe(expected);
  });

  it("projects a pick without mutating the server projection", () => {
    const source = team({ usageUnits: 85 });
    const result = projectedTeamCap(source, { uuid: "p", displayName: "P", priceUnits: 20 }, 100);

    expect(result).toEqual({ usageUnits: 105, remainingUnits: -5, overCap: true });
    expect(source.usageUnits).toBe(85);
  });

  it("searches names accent- and case-consistently for Portuguese UI", () => {
    const players = [
      { uuid: "1", displayName: "Álvaro", priceUnits: 10 },
      { uuid: "2", displayName: "GABINHO", priceUnits: 20 },
    ];

    expect(participantSearch(players, "gabi")).toEqual([players[1]]);
    expect(participantSearch(players, "")).toEqual(players);
  });

  it("calculates frozen trade balance against the snapshotted limit", () => {
    expect(
      tradeBalance({
        proposingValueUnits: 40,
        receivingValueUnits: 50,
        maximumDifferenceUnitsSnapshot: 10,
      } as never),
    ).toEqual({ proposing: 40, receiving: 50, difference: 10, withinLimit: true });
  });
});

function team({ usageUnits }: { usageUnits: number }) {
  return {
    uuid: "team",
    name: "Team",
    abbreviation: "T",
    colors: ["#10b981"],
    position: 1,
    usageUnits,
    remainingUnits: 0,
    overCap: false,
    rosterRevision: 1,
    rosterSize: 0,
    roster: [],
  };
}
