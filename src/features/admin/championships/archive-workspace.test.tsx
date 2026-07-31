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
  it("presents identity-snapshotted titles and partial historical data honestly", () => {
    render(
      <ChampionshipArchiveWorkspace
        mode="public"
        data={
          {
            championship: { lifecycle: "completed", historical: true },
            teams: { items: [] },
            participants: { items: [] },
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

    expect(screen.getAllByText("Aurora 2019")).toHaveLength(2);
    expect(screen.getByText("Título agregado a Aurora Football")).toBeTruthy();
    expect(screen.getByText("Jogos: não registrado")).toBeTruthy();
    expect(screen.getByText("Estatísticas: não registrado")).toBeTruthy();
  });
});
