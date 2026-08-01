import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChampionshipWorkspaceData } from "#/server/api/championship-api";

vi.mock("@tanstack/react-router", async (original) => ({
  ...(await original<typeof import("@tanstack/react-router")>()),
  useRouter: () => ({ invalidate: vi.fn() }),
}));

import { ChampionshipHonorsWorkspace } from "./honors-workspace";

afterEach(cleanup);

describe("championship honors workspace", () => {
  it("shows announced and awarded honors as distinct public facts", () => {
    const data = {
      championship: { uuid: crypto.randomUUID(), revision: 4 },
      teams: { items: [] },
      participants: { items: [] },
      format: { spots: { items: [] } },
      honors: {
        page: { limit: 100, nextCursor: null },
        items: [
          honor({
            name: "Jogador mais valioso",
            kind: "award",
            state: "announced",
            decisionPolicy: {
              type: "metric-ranking",
              metricKey: "receiving-yards",
              direction: "highest",
              limit: 1,
            },
          }),
          honor({
            name: "Campeão da copa",
            kind: "title",
            state: "awarded",
            decisionPolicy: { type: "placement", ranks: [1] },
            grants: [
              {
                uuid: crypto.randomUUID(),
                target: { type: "team", uuid: crypto.randomUUID() },
                displayLabel: "Equipe Aurora",
                identitySnapshot: { uuid: crypto.randomUUID(), name: "Aurora" },
                rank: 1,
                note: null,
                awardedAt: "2026-08-01T00:00:00.000Z",
                revokedAt: null,
                revocationReason: null,
              },
            ],
          }),
        ],
      },
    } as unknown as ChampionshipWorkspaceData;

    render(<ChampionshipHonorsWorkspace data={data} mode="public" />);

    expect(screen.getAllByText("Em disputa")).toHaveLength(2);
    expect(screen.getByText("Jogador mais valioso")).toBeTruthy();
    expect(screen.getByText("Vencedor a definir")).toBeTruthy();
    expect(screen.getByText("Conquistas confirmadas")).toBeTruthy();
    expect(screen.getByText("Campeão da copa")).toBeTruthy();
    expect(screen.getByText("Equipe Aurora")).toBeTruthy();
  });
});

function honor(overrides: Record<string, unknown>) {
  return {
    uuid: crypto.randomUUID(),
    state: "announced",
    revision: 0,
    displayOrder: 0,
    name: "Conquista",
    description: null,
    kind: "award",
    definition: {
      uuid: crypto.randomUUID(),
      slug: "conquista",
      versionUuid: crypto.randomUUID(),
      version: 1,
      recipientTypes: ["participant"],
      minimumRecipients: 1,
      maximumRecipients: 1,
      aggregateByIdentity: false,
      presentation: {},
    },
    decisionPolicy: { type: "staff-selection" },
    grants: [],
    announcedAt: "2026-08-01T00:00:00.000Z",
    awardedAt: null,
    voidedAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}
