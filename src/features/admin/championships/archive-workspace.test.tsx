import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChampionshipWorkspaceData } from "#/server/api/championship-api";

vi.mock("#/server/api/championship-functions", () => ({
  createChampionshipAwardFn: vi.fn(),
  replaceChampionshipPlacementsFn: vi.fn(),
  updateChampionshipAwardFn: vi.fn(),
}));

import { ChampionshipArchiveWorkspace } from "./archive-workspace";

afterEach(cleanup);

describe("championship archive workspace", () => {
  it("keeps final placement distinct from configured titles", () => {
    render(
      <ChampionshipArchiveWorkspace
        mode="public"
        data={
          {
            championship: { lifecycle: "completed", historical: true },
            teams: { items: [] },
            participants: { items: [] },
            honors: { items: [], page: { limit: 100, nextCursor: null } },
            history: {
              completeness: {
                placements: true,
                awards: false,
                teams: true,
                rosters: false,
                matches: false,
                detailedStatistics: false,
              },
              placements: {
                items: [
                  {
                    uuid: "50000000-0000-4000-8000-000000000001",
                    rank: 1,
                    source: "historical-import",
                    team: {
                      uuid: "20000000-0000-4000-8000-000000000001",
                      name: "Aurora",
                      abbreviation: "AUR",
                      identity: null,
                    },
                    identitySnapshot: {
                      uuid: "21000000-0000-4000-8000-000000000001",
                      name: "Aurora Football",
                    },
                    teamNameSnapshot: "Aurora 2019",
                    createdAt: "2026-01-01T00:00:00.000Z",
                  },
                ],
                totalCount: 1,
                truncated: false,
              },
              awards: { items: [], totalCount: 0, truncated: false },
              records: { items: [], totalCount: 0, truncated: false },
            },
          } as unknown as ChampionshipWorkspaceData
        }
      />,
    );

    expect(screen.getByText("Aurora 2019")).toBeTruthy();
    expect(screen.queryByText("Título agregado a Aurora Football")).toBeNull();
    expect(screen.getByText("Classificação final")).toBeTruthy();
  });

  it("omits the public placement section when no final placements exist", () => {
    render(
      <ChampionshipArchiveWorkspace
        mode="public"
        data={
          {
            championship: { lifecycle: "active", historical: false },
            teams: { items: [] },
            participants: { items: [] },
            honors: { items: [], page: { limit: 100, nextCursor: null } },
            history: {
              completeness: {
                placements: false,
                awards: false,
                teams: true,
                rosters: false,
                matches: false,
                detailedStatistics: false,
              },
              placements: { items: [], totalCount: 0, truncated: false },
              awards: { items: [], totalCount: 0, truncated: false },
              records: { items: [], totalCount: 0, truncated: false },
            },
          } as unknown as ChampionshipWorkspaceData
        }
      />,
    );

    expect(screen.queryByText("Classificação final")).toBeNull();
  });
});
