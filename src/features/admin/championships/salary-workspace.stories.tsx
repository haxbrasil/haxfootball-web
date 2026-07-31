import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ChampionshipWorkspaceData } from "#/server/api/championship-api";
import { SalaryWorkspace } from "./salary-workspace";

const championshipUuid = "10000000-0000-4000-8000-000000000001";
const teamAUuid = "10000000-0000-4000-8000-000000000002";
const teamBUuid = "10000000-0000-4000-8000-000000000003";

const meta = {
  title: "Championships/Salary workspace",
  component: SalaryWorkspace,
  parameters: {
    layout: "fullscreen",
    a11y: {
      test: "error",
    },
  },
} satisfies Meta<typeof SalaryWorkspace>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EditableValuation: Story = {
  args: {
    data: fixture("editable"),
    isAdmin: true,
  },
  render: ({ data }) => <SalaryWorkspaceStory data={data} />,
};

export const ApprovedOverCap: Story = {
  args: {
    data: fixture("over-cap"),
    isAdmin: true,
  },
  render: ({ data }) => <SalaryWorkspaceStory data={data} />,
};

function SalaryWorkspaceStory({ data }: { data: ChampionshipWorkspaceData }) {
  const rootRoute = createRootRoute();
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <h1 className="sr-only">Gestão salarial do campeonato</h1>
        <SalaryWorkspace data={data} isAdmin />
      </main>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return <RouterProvider router={router} />;
}

function fixture(state: "editable" | "over-cap"): ChampionshipWorkspaceData {
  const locked = state === "over-cap";
  const capUnits = locked ? 100 : 150;
  const participants = [
    participant("p-1", "Gabinho", 70, teamAUuid, "Aurora", "gm", locked),
    participant("p-2", "Digo0109", 55, teamAUuid, "Aurora", "player", locked),
    participant("p-3", "Mendes", 40, teamBUuid, "Bravos", "gm", locked),
    participant("p-4", "Lkz", 45, teamBUuid, "Bravos", "player", locked),
    participant("p-5", "Sem valor", null, null, null, null, locked),
  ];
  const salaryParticipants = participants.map((entry) => ({
    uuid: entry.uuid,
    displayName: entry.displayName,
    status: entry.status,
    priceUnits:
      entry.displayName === "Sem valor" && !locked
        ? null
        : entry.displayName === "Sem valor"
          ? 20
          : Number(
              entry.displayName === "Gabinho"
                ? 70
                : entry.displayName === "Digo0109"
                  ? 55
                  : entry.displayName === "Mendes"
                    ? 40
                    : 45,
            ),
    frozenAt: locked ? "2026-08-01T18:00:00.000Z" : null,
    membership: entry.activeMembership
      ? {
          uuid: entry.activeMembership.uuid,
          teamUuid: entry.activeMembership.team.uuid,
          teamName: entry.activeMembership.team.name,
          role: entry.activeMembership.role,
          priceUnitsSnapshot: entry.activeMembership.priceUnitsSnapshot,
        }
      : null,
  }));

  return {
    championship: {
      uuid: championshipUuid,
      slug: "copa-bfl-2026",
      name: "Copa BFL 2026",
      editionLabel: "Edição de agosto",
      description: null,
      lifecycle: "setup",
      visibility: "private",
      registrationState: locked ? "closed" : "open",
      priceState: locked ? "locked" : "editable",
      historical: false,
      revision: 18,
      changeSequence: 18,
      startsAt: "2026-08-03T18:00:00.000Z",
      endsAt: "2026-08-10T23:00:00.000Z",
      publishedAt: null,
      completedAt: null,
      createdAt: "2026-07-30T18:00:00.000Z",
      updatedAt: "2026-07-30T18:00:00.000Z",
      rulesSchemaVersion: 1,
      rules: {
        match: {
          sequentialRoundCount: 2,
          switchSides: true,
          drawPolicy: "overtime",
          overtimePolicy: "separate-period",
          overtimeRuleLabel: "Golden goal",
          fullForfeitScore: { winner: 3, loser: 0 },
        },
        roster: {
          minimumSize: 4,
          maximumSize: 8,
          lockPolicy: "draft-start",
        },
        salary: {
          enabled: true,
          capUnits,
          displayLabel: "créditos",
          maximumTradeDifference: 10,
        },
        draft: {
          rounds: 5,
          countdownSeconds: 60,
          publicPrices: true,
        },
        scheduling: {
          authority: "staff-and-gms",
          proposalMode: "both",
          latePlayPolicy: "staff-approval",
        },
      },
      competitionType: {
        uuid: "10000000-0000-4000-8000-000000000010",
        slug: "copa",
        name: "Copa",
        description: null,
        cadence: "multi-day",
        defaultRulesSchemaVersion: 1,
        defaultRules: {} as ChampionshipWorkspaceData["championship"]["rules"],
        state: "active",
        revision: 1,
        createdAt: "2026-07-30T18:00:00.000Z",
        updatedAt: "2026-07-30T18:00:00.000Z",
      },
      teams: [],
      roomPrograms: [],
      grants: [],
    },
    teams: {
      items: [],
      page: { limit: 100, nextCursor: null },
    },
    participants: {
      items: participants,
      page: { limit: 100, nextCursor: null },
    },
    teamIdentities: {
      items: [],
      page: { limit: 100, nextCursor: null },
    },
    roomPrograms: {
      items: [],
      page: { limit: 100, nextCursor: null },
    },
    audit: {
      items: [],
      page: { limit: 50, nextCursor: null },
    },
    threads: {
      items: [],
      page: { limit: 50, nextCursor: null },
    },
    assignments: {
      items: [],
      page: { limit: 50, nextCursor: null },
    },
    presence: [],
    inbox: {
      items: [],
      page: { limit: 30, nextCursor: null },
    },
    savedViews: {
      items: [],
      page: { limit: 20, nextCursor: null },
    },
    salary: {
      championshipUuid,
      enabled: true,
      priceState: locked ? "locked" : "editable",
      capUnits,
      displayLabel: "créditos",
      visibility: "admin",
      validation: {
        missingPriceCount: locked ? 0 : 1,
        missingParticipantIds: locked ? [] : ["p-5"],
        canFreeze: false,
      },
      participants: {
        items: salaryParticipants,
        page: { limit: 100, nextCursor: null },
      },
      teams: {
        items: [
          salaryTeam(teamAUuid, "Aurora", 125, 2, locked, capUnits),
          salaryTeam(teamBUuid, "Bravos", 85, 2, false, capUnits),
        ],
        page: { limit: 100, nextCursor: null },
      },
    },
    rosterHistory: {
      items: locked
        ? participants
            .filter(({ activeMembership }) => activeMembership)
            .map((entry) => ({
              uuid: entry.activeMembership!.uuid,
              participant: {
                uuid: entry.uuid,
                displayName: entry.displayName,
              },
              team: entry.activeMembership!.team,
              role: entry.activeMembership!.role,
              acquisitionSource: "draft" as const,
              acquisitionReferenceUuid: null,
              priceUnitsSnapshot: entry.activeMembership!.priceUnitsSnapshot,
              effectiveFromRevision: 1,
              effectiveToRevision: null,
              startedAt: "2026-08-01T19:00:00.000Z",
              endedAt: null,
            }))
        : [],
      page: { limit: 100, nextCursor: null },
    },
    draft: { draft: null },
    trades: {
      items: [],
      page: { limit: 100, nextCursor: null },
    },
    format: {
      championshipUuid,
      championshipRevision: 18,
      limit: 500,
      stages: { items: [], totalCount: 0, truncated: false },
      spots: { items: [], totalCount: 0, truncated: false },
      routes: { items: [], totalCount: 0, truncated: false },
      competitionRounds: { items: [], totalCount: 0, truncated: false },
      matches: { items: [], totalCount: 0, truncated: false },
    },
    accounts: {
      items: [
        { uuid: "a-1", name: "Conta disponível" },
        { uuid: "a-2", name: "Outra conta" },
      ],
      page: { limit: 100, nextCursor: null },
    },
  } as unknown as ChampionshipWorkspaceData;
}

function participant(
  uuid: string,
  name: string,
  price: number | null,
  teamUuid: string | null,
  teamName: string | null,
  role: "gm" | "player" | null,
  locked: boolean,
) {
  return {
    uuid,
    identity: {
      kind: "account" as const,
      accountUuid: `account-${uuid}`,
      name,
    },
    displayName: name,
    status: "active" as const,
    origin: "self" as const,
    activeMembership:
      teamUuid && teamName && role
        ? {
            uuid: `membership-${uuid}`,
            team: { uuid: teamUuid, name: teamName },
            role,
            acquisitionSource: "draft" as const,
            priceUnitsSnapshot: price,
            startedAt: "2026-08-01T19:00:00.000Z",
          }
        : null,
    registeredAt: "2026-07-31T18:00:00.000Z",
    registrationClosedAt: locked ? "2026-08-01T17:00:00.000Z" : null,
    withdrawnAt: null,
    revision: 1,
    createdAt: "2026-07-31T18:00:00.000Z",
    updatedAt: "2026-07-31T18:00:00.000Z",
  };
}

function salaryTeam(
  uuid: string,
  name: string,
  usage: number,
  rosterSize: number,
  exception: boolean,
  capUnits: number,
) {
  return {
    uuid,
    name,
    abbreviation: name.slice(0, 3).toUpperCase(),
    colors: name === "Aurora" ? ["#10B981", "#111827"] : ["#06B6D4", "#F59E0B"],
    rosterRevision: exception ? 3 : 2,
    rosterSize,
    usageUnits: usage,
    remainingUnits: capUnits - usage,
    overCap: usage > capUnits,
    approvedOverCap: exception,
    activeException: exception
      ? {
          uuid: "10000000-0000-4000-8000-000000000020",
          usageUnitsSnapshot: usage,
          rosterRevisionSnapshot: 3,
          expiresAtRevision: 4,
          approvedAt: "2026-08-01T20:00:00.000Z",
          reason: "Exceção de demonstração",
        }
      : null,
  };
}
