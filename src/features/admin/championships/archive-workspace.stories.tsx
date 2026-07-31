import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ChampionshipWorkspaceData } from "#/server/api/championship-api";
import { ChampionshipArchiveWorkspace } from "./archive-workspace";

const meta = {
  title: "Championships/Archive workspace",
  component: ChampionshipArchiveWorkspace,
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof ChampionshipArchiveWorkspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompletedCup: Story = {
  args: { data: archiveFixture(false), mode: "public" },
};

export const PartialHistoricalEdition: Story = {
  args: { data: archiveFixture(true), mode: "public" },
};

export const StaffCompletion: Story = {
  args: { data: archiveFixture(false), mode: "admin" },
};

function archiveFixture(historical: boolean) {
  const firstTeam = {
    uuid: "20000000-0000-4000-8000-000000000001",
    name: "Aurora",
    abbreviation: "AUR",
    teamIdentity: {
      uuid: "21000000-0000-4000-8000-000000000001",
      name: "Aurora Football",
      slug: "aurora-football",
    },
  };
  const secondTeam = {
    uuid: "20000000-0000-4000-8000-000000000002",
    name: "Carbono",
    abbreviation: "CAR",
    teamIdentity: null,
  };

  return {
    championship: {
      uuid: "10000000-0000-4000-8000-000000000001",
      revision: 24,
      lifecycle: "completed",
      historical,
    },
    teams: {
      items: [firstTeam, secondTeam],
      page: { limit: 64, nextCursor: null },
    },
    participants: {
      items: [
        {
          uuid: "30000000-0000-4000-8000-000000000001",
          displayName: "gabinho",
          identity: {
            kind: "account",
            accountUuid: "40000000-0000-4000-8000-000000000001",
          },
        },
        {
          uuid: "30000000-0000-4000-8000-000000000002",
          displayName: "Craque 2019",
          identity: {
            kind: "historical",
            historicalIdentityUuid: "31000000-0000-4000-8000-000000000002",
            displayName: "Craque 2019",
            aliases: ["Craque"],
            linkedAccount: null,
          },
        },
      ],
      page: { limit: 100, nextCursor: null },
    },
    accounts: {
      items: [{ uuid: "40000000-0000-4000-8000-000000000001", name: "gabinho" }],
      page: { limit: 100, nextCursor: null },
    },
    historicalImports: {
      items: [
        {
          uuid: "70000000-0000-4000-8000-000000000001",
          championshipUuid: "10000000-0000-4000-8000-000000000001",
          format: "csv",
          sourceName: "copa-2019.csv",
          sourceSha256: "b56d24879f614f87a15e5c6fb1b90f92",
          mapping: {},
          state: "applied",
          columns: ["entityType", "sourceKey", "name"],
          rowCount: 18,
          validCount: 16,
          warningCount: 2,
          invalidCount: 0,
          appliedCount: 18,
          errorCount: 0,
          appliedAt: "2026-07-30T10:30:00.000Z",
          rolledBackAt: null,
          createdAt: "2026-07-30T10:20:00.000Z",
          updatedAt: "2026-07-30T10:30:00.000Z",
          rows: {
            items: [
              {
                rowNumber: 1,
                sourceKey: "aurora",
                entityType: "team",
                entityUuid: firstTeam.uuid,
                state: "applied",
                raw: {
                  entityType: "team",
                  sourceKey: "aurora",
                  name: "Aurora",
                },
                normalized: {
                  values: { sourceKey: "aurora", name: "Aurora" },
                },
                messages: [],
              },
            ],
            totalCount: 18,
            truncated: true,
          },
        },
      ],
      page: { limit: 20, nextCursor: null },
    },
    history: {
      championship: {
        uuid: "10000000-0000-4000-8000-000000000001",
        slug: "copa-bfl-2026",
        name: "Copa BFL 2026",
        editionLabel: "Agosto",
        lifecycle: "completed",
        historical,
        completedAt: "2026-08-23T22:00:00.000Z",
        archivedAt: null,
      },
      completeness: {
        placements: true,
        awards: true,
        teams: true,
        rosters: !historical,
        matches: !historical,
        detailedStatistics: !historical,
      },
      placements: {
        items: [
          placement("50000000-0000-4000-8000-000000000001", 1, firstTeam, {
            uuid: firstTeam.teamIdentity.uuid,
            name: firstTeam.teamIdentity.name,
          }),
          placement("50000000-0000-4000-8000-000000000002", 2, secondTeam, null),
        ],
        totalCount: 2,
        truncated: false,
      },
      awards: {
        items: [
          {
            uuid: "60000000-0000-4000-8000-000000000001",
            kind: "mvp",
            rank: null,
            target: {
              type: "participant",
              uuid: "30000000-0000-4000-8000-000000000001",
            },
            displayLabel: "Melhor jogador",
            note: "Destaque da edição",
            identitySnapshot: null,
            awardedAt: "2026-08-23T22:00:00.000Z",
          },
        ],
        totalCount: 1,
        truncated: false,
      },
      records: {
        items: [
          {
            key: "placement.1",
            category: "title",
            label: "Títulos",
            targetUuid: firstTeam.teamIdentity.uuid,
            targetLabel: "Aurora",
            value: 1,
            source: "placement-ledger",
          },
          {
            key: "award.mvp",
            category: "award",
            label: "Melhor jogador",
            targetUuid: "30000000-0000-4000-8000-000000000001",
            targetLabel: "gabinho",
            value: 1,
            source: "award-ledger",
          },
        ],
        totalCount: 2,
        truncated: false,
      },
    },
  } as unknown as ChampionshipWorkspaceData;
}

function placement(
  uuid: string,
  rank: number,
  team: {
    uuid: string;
    name: string;
    abbreviation: string;
    teamIdentity: { uuid: string; name: string; slug: string } | null;
  },
  identitySnapshot: { uuid: string; name: string } | null,
) {
  return {
    uuid,
    rank,
    source: "staff",
    team: {
      uuid: team.uuid,
      name: team.name,
      abbreviation: team.abbreviation,
      identity: team.teamIdentity,
    },
    identitySnapshot,
    teamNameSnapshot: team.name,
    createdAt: "2026-08-23T22:00:00.000Z",
  };
}
