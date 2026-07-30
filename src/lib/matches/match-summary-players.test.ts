import { describe, expect, it } from "vitest";
import { matchSummaryPlayers } from "./match-summary-players";

describe("matchSummaryPlayers", () => {
  it("returns the roster of a physical match", () => {
    const players = [{ id: "ana", name: "Ana", team: "red" as const }];

    expect(matchSummaryPlayers({ kind: "single", players })).toEqual(players);
  });

  it("normalizes composed-round teams and keeps each player's latest appearance", () => {
    expect(
      matchSummaryPlayers({
        kind: "composed",
        rounds: [
          {
            orientation: "aligned",
            match: {
              id: "round-one",
              players: [{ id: "bia", name: "Bia", team: "red" }],
            },
          },
          {
            orientation: "swapped",
            match: {
              id: "round-two",
              players: [
                { id: "bia", name: "Bia", team: "blue" },
                { id: "caio", name: "Caio", team: "red" },
              ],
            },
          },
        ],
      }),
    ).toEqual([
      { id: "bia", name: "Bia", team: "red" },
      { id: "caio", name: "Caio", team: "blue" },
    ]);
  });
});
