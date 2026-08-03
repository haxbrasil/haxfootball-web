import { describe, expect, it } from "vitest";
import type { PublicChampionshipDetail } from "#/server/api/championship-api";
import { sortPublicChampionshipMatches } from "./championship-match-order";

type Match = PublicChampionshipDetail["format"]["matches"]["items"][number];
type Stage = PublicChampionshipDetail["format"]["stages"]["items"][number];

function match(
  uuid: string,
  stageUuid: string,
  displayOrder: number,
  label: string,
  scheduledAt: string | null,
) {
  return { uuid, stageUuid, displayOrder, label, scheduledAt } as Match;
}

function stage(uuid: string, displayOrder: number) {
  return { uuid, displayOrder } as Stage;
}

describe("public championship match order", () => {
  it("follows stage and match display order instead of schedule or label order", () => {
    const matches = [
      match("final", "knockout", 2, "Final", "2026-08-03T20:00:00.000Z"),
      match("group-2", "group", 1, "Grupo A · Jogo 2", "2026-08-01T20:00:00.000Z"),
      match("semifinal", "knockout", 1, "Semifinal 1", "2026-08-02T20:00:00.000Z"),
      match("group-1", "group", 0, "Grupo A · Jogo 1", null),
    ];

    expect(
      sortPublicChampionshipMatches(matches, [stage("group", 0), stage("knockout", 1)]).map(
        (item) => item.uuid,
      ),
    ).toEqual(["group-1", "group-2", "semifinal", "final"]);
  });
});
