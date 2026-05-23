import { describe, expect, it } from "vitest";
import type { MatchDetail } from "#/server/api/haxfootball";
import { createMatchTeamGroups } from "./create-match-team-groups";

type MatchParticipation = NonNullable<MatchDetail["match"]>["participations"][number];

const participation = (
  input: Omit<Partial<MatchParticipation>, "player"> & {
    player: Pick<MatchParticipation["player"], "id" | "name">;
    team: MatchParticipation["team"];
  },
): MatchParticipation =>
  ({
    joinedAt: null,
    joinedElapsedSeconds: null,
    leftAt: null,
    leftElapsedSeconds: null,
    roomPlayerId: null,
    ...input,
    player: {
      account: null,
      country: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      externalId: input.player.id,
      id: input.player.id,
      name: input.player.name,
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  }) as MatchParticipation;

describe("createMatchTeamGroups", () => {
  it("groups unique players by their latest team", () => {
    const groups = createMatchTeamGroups([
      participation({
        joinedElapsedSeconds: 1,
        player: { id: "one", name: "Ana" },
        team: "red",
      }),
      participation({
        joinedElapsedSeconds: 5,
        player: { id: "one", name: "Ana" },
        team: "blue",
      }),
      participation({
        joinedElapsedSeconds: 2,
        player: { id: "two", name: "Bia" },
        team: "red",
      }),
    ]);

    expect(groups.red.map((item) => item.player.name)).toEqual(["Bia"]);
    expect(groups.blue.map((item) => item.player.name)).toEqual(["Ana"]);
  });
});
