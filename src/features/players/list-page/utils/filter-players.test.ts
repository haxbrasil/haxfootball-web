import type { Player } from "@haxbrasil/haxfootball-api-sdk";
import { describe, expect, it } from "vitest";
import { filterPlayers } from "./filter-players";

const players: Player[] = [
  {
    account: {
      externalId: "discord-1",
      name: "Conta Alpha",
      uuid: "account-1",
    },
    country: "br",
    createdAt: "2026-01-01T00:00:00.000Z",
    id: "player-1",
    name: "Alpha",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    account: null,
    country: "ar",
    createdAt: "2026-01-01T00:00:00.000Z",
    id: "player-2",
    name: "Beta",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("filterPlayers", () => {
  it("filters by name, country, account name, or external id", () => {
    expect(filterPlayers(players, "alpha")).toEqual([players[0]]);
    expect(filterPlayers(players, "ar")).toEqual([players[1]]);
    expect(filterPlayers(players, "conta")).toEqual([players[0]]);
    expect(filterPlayers(players, "discord-1")).toEqual([players[0]]);
  });

  it("returns all players for an empty query", () => {
    expect(filterPlayers(players, " ")).toEqual(players);
  });
});
