import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ChampionshipWorkspaceData } from "#/server/api/championship-api";
import { DraftWorkspace } from "./draft-workspace";

type DraftStoryData = Pick<
  ChampionshipWorkspaceData,
  "championship" | "teams" | "draft" | "trades"
>;

const meta = {
  title: "Championships/Draft workspace",
  component: DraftWorkspace,
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
  },
} satisfies Meta<typeof DraftWorkspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Setup: Story = story("setup", "admin");
export const AdminLive: Story = story("live", "admin");
export const Live: Story = story("live", "public");
export const MultipleOverdue: Story = story("overdue", "admin");
export const CompletedWithAcceptedTrade: Story = story("completed", "public");

function story(state: FixtureState, mode: "admin" | "public"): Story {
  const data = fixture(state);

  return {
    args: {
      data,
      session: null,
      mode,
      poll: false,
    },
    render: (args) => <DraftWorkspaceStory {...args} />,
  };
}

function DraftWorkspaceStory({ data, session, mode, poll }: ComponentProps<typeof DraftWorkspace>) {
  const rootRoute = createRootRoute();
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
        <div className="mb-5">
          <BadgeLine state={data.draft.draft?.state ?? "setup"} />
          <h1 className="mt-2 text-2xl font-semibold">Copa BFL 2026</h1>
          <p className="text-sm text-muted-foreground">Draft oficial · edição de agosto</p>
        </div>
        <DraftWorkspace data={data} session={session} mode={mode} poll={poll} />
      </main>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return <RouterProvider router={router} />;
}

function BadgeLine({ state }: { state: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-emerald-300">
      <span className="size-2 bg-emerald-400" />
      Campeonato
      <span className="text-muted-foreground">· {state}</span>
    </div>
  );
}

type FixtureState = "setup" | "live" | "overdue" | "completed";

function fixture(state: FixtureState): DraftStoryData {
  const now = Date.now();
  const teamIds = [
    "20000000-0000-4000-8000-000000000001",
    "20000000-0000-4000-8000-000000000002",
    "20000000-0000-4000-8000-000000000003",
    "20000000-0000-4000-8000-000000000004",
  ];
  const names = ["Aurora", "Bravos", "Carbono", "Dínamo"];
  const colors = [
    ["#10B981", "#111827"],
    ["#06B6D4", "#F59E0B"],
    ["#F43F5E", "#F8FAFC"],
    ["#EAB308", "#1D4ED8"],
  ];
  const teams = teamIds.map((uuid, index) => ({
    uuid,
    name: names[index],
    abbreviation: names[index].slice(0, 3).toUpperCase(),
    colors: colors[index],
    teamIdentity: null,
    seed: index + 1,
    displayOrder: index,
    rosterRevision: 3,
    state: "active" as const,
    revision: 1,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  }));
  const roster = (index: number) => [
    {
      participantUuid: `30000000-0000-4000-8000-00000000000${index + 1}`,
      displayName: ["Gabinho", "Digo0109", "Mendes", "Lkz"][index],
      role: "gm" as const,
      priceUnits: 20,
    },
    ...(state === "setup"
      ? []
      : [
          {
            participantUuid: `40000000-0000-4000-8000-00000000000${index + 1}`,
            displayName: ["Rafinha", "Kadu", "Victor", "Jhow"][index],
            role: "player" as const,
            priceUnits: 25 + index * 5,
          },
        ]),
  ];
  const draftTeams = teams.map((team, index) => {
    const usageUnits = roster(index).reduce((total, member) => total + member.priceUnits, 0);

    return {
      uuid: team.uuid,
      name: team.name,
      abbreviation: team.abbreviation,
      colors: team.colors,
      position: index + 1,
      rosterRevision: 3,
      rosterSize: roster(index).length,
      usageUnits,
      remainingUnits: 100 - usageUnits,
      overCap: false,
      roster: roster(index),
    };
  });
  const filledCount = state === "setup" ? 0 : state === "live" ? 3 : state === "overdue" ? 5 : 8;
  const turns = Array.from({ length: 16 }, (_, index) => {
    const round = Math.floor(index / 4) + 1;
    const sequenceInRound = index % 4;
    const teamIndex = round % 2 === 1 ? sequenceInRound : 3 - sequenceInRound;
    const filled = index < filledCount;
    const overdue = state === "overdue" && (index === filledCount || index === filledCount + 1);
    const open = state !== "completed" && index === filledCount + (state === "overdue" ? 2 : 0);

    return {
      uuid: `50000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      sequence: index + 1,
      round,
      position: sequenceInRound + 1,
      team: { uuid: teams[teamIndex].uuid, name: teams[teamIndex].name },
      state: filled
        ? ("filled" as const)
        : overdue
          ? ("overdue" as const)
          : open
            ? ("open" as const)
            : ("pending" as const),
      openedAt: filled || overdue || open ? new Date(now - 40_000).toISOString() : null,
      deadlineAt: open
        ? new Date(now + 43_000).toISOString()
        : overdue
          ? new Date(now - 8_000).toISOString()
          : null,
      overdueAt: overdue ? new Date(now - 8_000).toISOString() : null,
      filledAt: filled ? new Date(now - (filledCount - index) * 50_000).toISOString() : null,
      selectedParticipant: filled
        ? {
            uuid: `60000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
            displayName: ["Nando", "Biel", "Gui", "Dudu", "PH", "Tico", "Luan", "Iago"][index],
          }
        : null,
      priceUnitsSnapshot: filled ? 20 + index * 3 : null,
      revision: filled ? 2 : 1,
    };
  });
  const draftState = state === "completed" ? "completed" : state === "setup" ? "setup" : "live";

  return {
    championship: {
      uuid: "10000000-0000-4000-8000-000000000001",
      slug: "copa-bfl-2026",
      name: "Copa BFL 2026",
      editionLabel: "Edição de agosto",
      description: null,
      lifecycle: draftState === "live" ? "active" : "setup",
      visibility: "public",
      registrationState: "closed",
      priceState: "locked",
      historical: false,
      revision: 28,
      changeSequence: 28,
      startsAt: new Date(now).toISOString(),
      endsAt: null,
      publishedAt: new Date(now).toISOString(),
      completedAt: null,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
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
        roster: { minimumSize: 4, maximumSize: 8, lockPolicy: "draft-start" },
        salary: {
          enabled: true,
          capUnits: 100,
          displayLabel: "M",
          maximumTradeDifference: 10,
        },
        draft: { rounds: 4, countdownSeconds: 60, publicPrices: true },
        scheduling: {
          authority: "staff-and-gms",
          proposalMode: "both",
          latePlayPolicy: "staff-approval",
        },
      },
      competitionType: {
        uuid: "90000000-0000-4000-8000-000000000001",
        slug: "copa",
        name: "Copa",
        description: null,
        cadence: "multi-day",
        defaultRulesSchemaVersion: 1,
        defaultRules: {} as ChampionshipWorkspaceData["championship"]["rules"],
        state: "active",
        revision: 1,
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      },
      teams: [],
      roomPrograms: [],
      grants: [],
    },
    teams: {
      items: teams,
      page: { limit: 64, nextCursor: null },
    },
    draft: {
      draft: {
        uuid: "70000000-0000-4000-8000-000000000001",
        state: draftState,
        rounds: 4,
        countdownSeconds: 60,
        revision: 8,
        championshipRevision: 28,
        nextTurnSequence: filledCount + 1,
        startedAt: draftState === "setup" ? null : new Date(now - 400_000).toISOString(),
        completedAt: draftState === "completed" ? new Date(now).toISOString() : null,
        canceledAt: null,
        createdAt: new Date(now - 86_400_000).toISOString(),
        updatedAt: new Date(now).toISOString(),
        serverTime: new Date(now).toISOString(),
        actor: {
          canManage: state === "setup" || state === "overdue",
          gmTeamIds: [],
          eligibleTurnIds:
            state === "overdue"
              ? turns.filter((turn) => turn.state === "overdue").map((turn) => turn.uuid)
              : [],
        },
        teams: draftTeams,
        turns: {
          items: turns,
          page: { limit: 100, nextCursor: null },
        },
        availableParticipants: {
          items: Array.from({ length: 12 }, (_, index) => ({
            uuid: `80000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
            displayName: [
              "Danilo",
              "Enzo",
              "Felipe",
              "Gustavo",
              "Henrique",
              "João",
              "Kauan",
              "Lucas",
              "Marcos",
              "Nicolas",
              "Otávio",
              "Pedro",
            ][index],
            priceUnits: 12 + index * 3,
          })),
          page: { limit: 100, nextCursor: null },
        },
      },
    },
    trades: {
      items:
        state === "completed"
          ? [
              {
                uuid: "91000000-0000-4000-8000-000000000001",
                state: "accepted",
                proposingTeam: { uuid: teamIds[0], name: names[0] },
                receivingTeam: { uuid: teamIds[1], name: names[1] },
                proposer: {
                  accountUuid: "92000000-0000-4000-8000-000000000001",
                  name: "Gabinho",
                },
                items: [
                  {
                    participant: {
                      uuid: "93000000-0000-4000-8000-000000000001",
                      displayName: "Rafinha",
                    },
                    fromTeamUuid: teamIds[0],
                    toTeamUuid: teamIds[1],
                    frozenPriceUnits: 25,
                  },
                  {
                    participant: {
                      uuid: "93000000-0000-4000-8000-000000000002",
                      displayName: "Kadu",
                    },
                    fromTeamUuid: teamIds[1],
                    toTeamUuid: teamIds[0],
                    frozenPriceUnits: 30,
                  },
                ],
                proposingValueUnits: 25,
                receivingValueUnits: 30,
                valueDifferenceUnits: 5,
                maximumDifferenceUnitsSnapshot: 10,
                actorActions: { canAccept: false, canReject: false, canCancel: false },
                revision: 2,
                proposedAt: new Date(now - 86_400_000).toISOString(),
                deadlineAt: null,
                decidedAt: new Date(now - 43_200_000).toISOString(),
                decidedBy: {
                  accountUuid: "92000000-0000-4000-8000-000000000002",
                  name: "Digo0109",
                },
                createdAt: new Date(now - 86_400_000).toISOString(),
                updatedAt: new Date(now - 43_200_000).toISOString(),
              },
            ]
          : [],
      page: { limit: 100, nextCursor: null },
    },
  } as unknown as DraftStoryData;
}
