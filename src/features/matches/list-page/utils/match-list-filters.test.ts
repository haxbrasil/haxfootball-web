import { describe, expect, it } from "vitest";
import {
  defaultMatchListFilters,
  filterMatches,
  getActiveMatchFilterLabels,
  isScorelessMatch,
  type MatchListFilterState,
} from "./match-list-filters";

describe("isScorelessMatch", () => {
  it("matches numeric and serialized zero scores", () => {
    expect(isScorelessMatch({ score: { red: 0, blue: 0 } })).toBe(true);
    expect(isScorelessMatch({ score: { red: "0", blue: "0" } })).toBe(true);
  });

  it("keeps matches with points or a pending score", () => {
    expect(isScorelessMatch({ score: { red: 1, blue: 0 } })).toBe(false);
    expect(isScorelessMatch({ score: null })).toBe(false);
    expect(isScorelessMatch({ score: { red: null, blue: null } })).toBe(false);
  });
});

type FilterTestMatch = {
  id: string;
  kind: "single" | "composed";
  status: string;
  createdAt: string;
  initiatedAt: string | null;
  score: { red: number; blue: number } | null;
  players?: Array<{ id: string; name: string; team: "red" | "blue" }>;
  rounds?: Array<{
    orientation: "aligned" | "swapped";
    match: {
      id: string;
      players: Array<{ id: string; name: string; team: "red" | "blue" }>;
    };
  }>;
};

const matches: FilterTestMatch[] = [
  {
    id: "9jaqffdq",
    kind: "single",
    status: "completed",
    createdAt: "2026-07-29T15:00:00.000Z",
    initiatedAt: "2026-07-29T15:00:00.000Z",
    score: { red: 6, blue: 2 },
    players: [{ id: "one", name: "LOUD Coringa", team: "red" }],
  },
  {
    id: "wy8enfn6",
    kind: "single",
    status: "completed",
    createdAt: "2026-07-30T15:00:00.000Z",
    initiatedAt: "2026-07-30T15:00:00.000Z",
    score: { red: 0, blue: 0 },
    players: [{ id: "two", name: "MGzinxs", team: "blue" }],
  },
  {
    id: "cv24atmd",
    kind: "composed",
    status: "ongoing",
    createdAt: "2026-07-31T15:00:00.000Z",
    initiatedAt: "2026-07-31T15:00:00.000Z",
    score: { red: 12, blue: 9 },
    rounds: [
      {
        orientation: "aligned",
        match: {
          id: "roundone",
          players: [{ id: "three", name: "Brushi", team: "red" }],
        },
      },
    ],
  },
  {
    id: "empty123",
    kind: "single",
    status: "pending",
    createdAt: "2026-08-01T15:00:00.000Z",
    initiatedAt: null,
    score: null,
    players: [],
  },
];

function filters(patch: Partial<MatchListFilterState> = {}): MatchListFilterState {
  return { ...defaultMatchListFilters, ...patch };
}

describe("filterMatches", () => {
  it("hides scoreless matches by default", () => {
    expect(filterMatches(matches, filters()).map((match) => match.id)).not.toContain("wy8enfn6");
  });

  it("searches normalized match IDs and player names", () => {
    expect(
      filterMatches(matches, filters({ matchId: "9JAQ-FF", hideScoreless: false })).map(
        (match) => match.id,
      ),
    ).toEqual(["9jaqffdq"]);
    expect(
      filterMatches(matches, filters({ player: "brus", hideScoreless: false })).map(
        (match) => match.id,
      ),
    ).toEqual(["cv24atmd"]);
  });

  it("filters by inclusive date and total score ranges", () => {
    expect(
      filterMatches(
        matches,
        filters({
          dateFrom: "2026-07-29",
          dateTo: "2026-07-30",
          minimumScore: "8",
          maximumScore: "8",
          hideScoreless: false,
        }),
      ).map((match) => match.id),
    ).toEqual(["9jaqffdq"]);
  });

  it("filters status, type, and player data", () => {
    expect(
      filterMatches(
        matches,
        filters({
          status: "unfinished",
          kind: "composed",
          requirePlayers: true,
          hideScoreless: false,
        }),
      ).map((match) => match.id),
    ).toEqual(["cv24atmd"]);
  });
});

describe("getActiveMatchFilterLabels", () => {
  it("summarizes active filters", () => {
    expect(
      getActiveMatchFilterLabels(
        filters({ matchId: "9jaq", player: "Coringa", status: "completed" }),
      ),
    ).toEqual(["Sem 0 × 0", "ID: 9JAQ", "Jogador: Coringa", "Finalizadas"]);
  });
});
