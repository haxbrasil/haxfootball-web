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
import { FormatWorkspace } from "./format-workspace";

const meta = {
  title: "Championships/Format workspace",
  component: FormatWorkspace,
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
  },
} satisfies Meta<typeof FormatWorkspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CupBracket: Story = {
  args: { data: fixture(), mode: "admin" },
  render: (args) => <FormatStory {...args} />,
};

export const PublicBracket: Story = {
  args: { data: fixture(), mode: "public" },
  render: (args) => <FormatStory {...args} />,
};

export const ScheduleNegotiation: Story = {
  args: { data: fixture(), mode: "public", canNegotiateSchedule: true },
  render: (args) => <FormatStory {...args} />,
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector<HTMLButtonElement>(
      'button[title="Detalhes da partida"]',
    );
    button?.click();
  },
};

export const DoubleElimination: Story = {
  args: { data: doubleEliminationFixture(), mode: "admin" },
  render: (args) => <FormatStory {...args} />,
};

export const GroupStandings: Story = {
  args: { data: standingsFixture(), mode: "admin" },
  render: (args) => <FormatStory {...args} />,
};

function FormatStory({ data, mode, canNegotiateSchedule }: ComponentProps<typeof FormatWorkspace>) {
  const rootRoute = createRootRoute();
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase text-emerald-300">Copa BFL 2026</div>
          <h1 className="mt-1 text-2xl font-semibold">Classificação e chaves</h1>
          <p className="text-sm text-muted-foreground">Da fase de grupos até a decisão</p>
        </div>
        <FormatWorkspace data={data} mode={mode} canNegotiateSchedule={canNegotiateSchedule} />
      </main>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return <RouterProvider router={router} />;
}

function fixture() {
  const now = "2026-08-01T18:00:00.000Z";
  const championshipUuid = "10000000-0000-4000-8000-000000000001";
  const teams = Array.from({ length: 8 }, (_, index) => ({
    uuid: `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    teamIdentity: null,
    name: ["Aurora", "Bravos", "Carbono", "Dínamo", "Estrela", "Fúria", "Galáticos", "Horizonte"][
      index
    ],
    abbreviation: ["AUR", "BRA", "CAR", "DIN", "EST", "FUR", "GAL", "HOR"][index],
    colors: [
      ["#10B981", "#111827"],
      ["#06B6D4", "#F59E0B"],
      ["#F43F5E", "#F8FAFC"],
      ["#EAB308", "#1D4ED8"],
      ["#A855F7", "#F8FAFC"],
      ["#EF4444", "#111827"],
      ["#3B82F6", "#F8FAFC"],
      ["#14B8A6", "#F59E0B"],
    ][index],
    brandingSnapshot: null,
    seed: index + 1,
    displayOrder: index,
    state: "active" as const,
    rosterRevision: 1,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  }));
  const spots: ChampionshipWorkspaceData["format"]["spots"]["items"] = [];
  const matches: ChampionshipWorkspaceData["format"]["matches"]["items"] = [];
  const routes: ChampionshipWorkspaceData["format"]["routes"]["items"] = [];
  const roundCount = 3;
  let displayOrder = 0;

  for (let round = 1; round <= roundCount; round += 1) {
    const count = 8 / 2 ** round;

    for (let position = 1; position <= count; position += 1) {
      const matchUuid = `30000000-0000-4000-8000-${String((round - 1) * 10 + position).padStart(
        12,
        "0",
      )}`;
      const sideAUuid = `40000000-0000-4000-8000-${String(
        (round - 1) * 20 + position * 2 - 1,
      ).padStart(12, "0")}`;
      const sideBUuid = `40000000-0000-4000-8000-${String((round - 1) * 20 + position * 2).padStart(
        12,
        "0",
      )}`;
      const firstTeam = round === 1 ? teams[(position - 1) * 2] : null;
      const secondTeam = round === 1 ? teams[(position - 1) * 2 + 1] : null;

      spots.push(
        spot(sideAUuid, `r${round}-m${position}-a`, displayOrder++, firstTeam, round, position * 2),
        spot(
          sideBUuid,
          `r${round}-m${position}-b`,
          displayOrder++,
          secondTeam,
          round,
          position * 2 + 1,
        ),
      );
      matches.push({
        uuid: matchUuid,
        stageUuid: "50000000-0000-4000-8000-000000000001",
        groupUuid: null,
        label:
          round === 3
            ? "Grande final"
            : round === 2
              ? `Semifinal ${position}`
              : `Quartas ${position}`,
        displayOrder: matches.length,
        sideA: { spotUuid: sideAUuid, team: teamReference(firstTeam) },
        sideB: { spotUuid: sideBUuid, team: teamReference(secondTeam) },
        competitionRoundUuid: `60000000-0000-4000-8000-${String(round).padStart(12, "0")}`,
        scheduledAt: round === 1 && position === 1 ? "2026-08-03T21:00:00.000Z" : null,
        scheduleStatus: round === 1 && position === 1 ? "scheduled" : "unscheduled",
        roomProgram:
          round === 1 && position === 1
            ? {
                uuid: "70000000-0000-4000-8000-000000000001",
                name: "HaxFootball atual",
              }
            : null,
        matchRulesOverride: null,
        bracket: "winners",
        bracketRound: round,
        bracketPosition: position,
        evidenceRevision: 0,
        resultRevision: 0,
        scheduleRevision: 0,
        revision: 1,
        createdAt: now,
        updatedAt: now,
      });

      if (round < roundCount) {
        routes.push({
          uuid: `80000000-0000-4000-8000-${String((round - 1) * 10 + position).padStart(12, "0")}`,
          sourceKind: "match-outcome",
          sourceMatchUuid: matchUuid,
          sourceGroupUuid: null,
          sourceOutcome: "winner",
          sourceRank: null,
          condition: "always",
          destinationSpotUuid:
            position % 2
              ? `40000000-0000-4000-8000-${String(
                  round * 20 + Math.ceil(position / 2) * 2 - 1,
                ).padStart(12, "0")}`
              : `40000000-0000-4000-8000-${String(
                  round * 20 + Math.ceil(position / 2) * 2,
                ).padStart(12, "0")}`,
          priority: 0,
          state: "active",
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  return {
    championship: {
      uuid: championshipUuid,
      name: "Copa BFL 2026",
      slug: "copa-bfl-2026",
      startsAt: "2026-08-01T18:00:00.000Z",
      competitionType: {
        uuid: "10000000-0000-4000-8000-000000000099",
        slug: "copa",
        name: "Copa",
        cadence: "multi-day",
      },
      rules: {
        scheduling: {
          authority: "staff-and-gms",
          proposalMode: "both",
          latePlayPolicy: "staff-approval",
        },
      },
    },
    teams: { items: teams, page: { limit: 64, nextCursor: null } },
    roomPrograms: {
      items: [
        {
          id: "70000000-0000-4000-8000-000000000001",
          name: "HaxFootball atual",
        },
        {
          id: "70000000-0000-4000-8000-000000000002",
          name: "HaxFootball v1",
        },
      ],
      page: { limit: 100, nextCursor: null },
    },
    format: {
      championshipUuid,
      championshipRevision: 24,
      limit: 500,
      stages: {
        items: [
          {
            uuid: "50000000-0000-4000-8000-000000000001",
            name: "Mata-mata",
            displayOrder: 0,
            engine: "single-elimination",
            state: "active",
            configSchemaVersion: 1,
            config: { bracketSize: 8, teamCount: 8, seeding: "standard" },
            defaultRoomProgram: {
              uuid: "70000000-0000-4000-8000-000000000001",
              name: "HaxFootball atual",
            },
            revision: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
        totalCount: 1,
        truncated: false,
      },
      groups: { items: [], totalCount: 0, truncated: false },
      spots: { items: spots, totalCount: spots.length, truncated: false },
      routes: { items: routes, totalCount: routes.length, truncated: false },
      competitionRounds: {
        items: [1, 2, 3].map((round) => ({
          uuid: `60000000-0000-4000-8000-${String(round).padStart(12, "0")}`,
          stageUuid: "50000000-0000-4000-8000-000000000001",
          name: ["Quartas de final", "Semifinais", "Final"][round - 1],
          sequence: round,
          startsAt: `2026-08-0${round + 2}T18:00:00.000Z`,
          endsAt: `2026-08-0${round + 3}T03:00:00.000Z`,
          schedulingAuthority: "staff-and-gms",
          latePlayPolicy: "staff-approval",
          createdAt: now,
          updatedAt: now,
        })),
        totalCount: 3,
        truncated: false,
      },
      matches: { items: matches, totalCount: matches.length, truncated: false },
    },
  } as unknown as ComponentProps<typeof FormatWorkspace>["data"];
}

function standingsFixture() {
  const data = fixture();
  const now = "2026-08-01T18:00:00.000Z";
  const stageUuid = "50000000-0000-4000-8000-000000000001";
  const groupUuid = "51000000-0000-4000-8000-000000000001";

  data.format.stages.items[0] = {
    ...data.format.stages.items[0]!,
    name: "Fase classificatória",
    engine: "standings",
    config: {
      standingsScoring: { win: 3, draw: 1, loss: 0 },
      headToHeadRestart: "restart-for-subgroup",
    },
    revision: 4,
  };
  data.format.groups = {
    items: [
      {
        uuid: groupUuid,
        stageUuid,
        name: "Grupo A",
        displayOrder: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    totalCount: 1,
    truncated: false,
  };
  data.format.spots = {
    items: data.teams.items.slice(0, 6).map((team, index) => ({
      uuid: `55000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      stageUuid,
      groupUuid,
      key: `group-a-${index + 1}`,
      label: `Grupo A · ${team.name}`,
      kind: "group-entry" as const,
      displayOrder: index,
      placementRank: null,
      currentTeam: teamReference(team),
      x: null,
      y: null,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    })),
    totalCount: 6,
    truncated: false,
  };
  data.format.matches = { items: [], totalCount: 0, truncated: false };
  data.format.routes = { items: [], totalCount: 0, truncated: false };
  data.format.competitionRounds = {
    items: [],
    totalCount: 0,
    truncated: false,
  };

  return data;
}

function doubleEliminationFixture() {
  const data = fixture();
  const now = "2026-08-01T18:00:00.000Z";
  const teams = data.teams.items.slice(0, 4);
  const definitions = [
    ["w-r1-m1", "Superior 1 · jogo 1", "winners", 1, 1, teams[0], teams[1]],
    ["w-r1-m2", "Superior 1 · jogo 2", "winners", 1, 2, teams[2], teams[3]],
    ["w-r2-m1", "Final da chave superior", "winners", 2, 1, null, null],
    ["l-r1-m1", "Inferior 1 · jogo 1", "losers", 1, 1, null, null],
    ["l-r2-m1", "Final da chave inferior", "losers", 2, 1, null, null],
    ["grand-final-1", "Grande final 1", "grand-final", 1, 1, null, null],
    ["grand-final-reset", "Grande final decisiva", "grand-final", 2, 1, null, null],
  ] as const;
  const spots: ChampionshipWorkspaceData["format"]["spots"]["items"] = [];
  const matches: ChampionshipWorkspaceData["format"]["matches"]["items"] = [];
  const spotUuidByKey = new Map<string, string>();

  definitions.forEach(([key, label, bracket, round, position, teamA, teamB], index) => {
    const matchUuid = `91000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    const sideAUuid = `92000000-0000-4000-8000-${String(index * 2 + 1).padStart(12, "0")}`;
    const sideBUuid = `92000000-0000-4000-8000-${String(index * 2 + 2).padStart(12, "0")}`;
    spotUuidByKey.set(`${key}-a`, sideAUuid);
    spotUuidByKey.set(`${key}-b`, sideBUuid);
    spots.push(
      spot(sideAUuid, `${key}-a`, index * 2, teamA, round, position * 2),
      spot(sideBUuid, `${key}-b`, index * 2 + 1, teamB, round, position * 2 + 1),
    );
    matches.push({
      uuid: matchUuid,
      stageUuid: "50000000-0000-4000-8000-000000000001",
      groupUuid: null,
      label,
      displayOrder: index,
      sideA: { spotUuid: sideAUuid, team: teamReference(teamA) },
      sideB: { spotUuid: sideBUuid, team: teamReference(teamB) },
      competitionRoundUuid: `60000000-0000-4000-8000-${String(Math.min(index + 1, 5)).padStart(
        12,
        "0",
      )}`,
      scheduledAt: index < 2 ? `2026-08-0${index + 3}T21:00:00.000Z` : null,
      scheduleStatus: index < 2 ? "scheduled" : "unscheduled",
      roomProgram: null,
      matchRulesOverride: null,
      bracket,
      bracketRound: round,
      bracketPosition: position,
      evidenceRevision: 0,
      resultRevision: 0,
      scheduleRevision: 0,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    });
  });
  const matchUuid = (key: string) =>
    matches[definitions.findIndex((definition) => definition[0] === key)]!.uuid;
  const routeDefinitions = [
    ["w-r1-m1", "winner", "w-r2-m1-a", "always"],
    ["w-r1-m2", "winner", "w-r2-m1-b", "always"],
    ["w-r1-m1", "loser", "l-r1-m1-a", "always"],
    ["w-r1-m2", "loser", "l-r1-m1-b", "always"],
    ["l-r1-m1", "winner", "l-r2-m1-a", "always"],
    ["w-r2-m1", "loser", "l-r2-m1-b", "always"],
    ["w-r2-m1", "winner", "grand-final-1-a", "always"],
    ["l-r2-m1", "winner", "grand-final-1-b", "always"],
    ["grand-final-1", "loser", "grand-final-reset-a", "if-side-b-wins"],
    ["grand-final-1", "winner", "grand-final-reset-b", "if-side-b-wins"],
    ["grand-final-1", "winner", "placement-champion", "if-side-a-wins"],
    ["grand-final-1", "loser", "placement-runner-up", "if-side-a-wins"],
    ["grand-final-reset", "winner", "placement-champion", "always"],
    ["grand-final-reset", "loser", "placement-runner-up", "always"],
  ] as const;
  const championSpot = `92000000-0000-4000-8000-${String(15).padStart(12, "0")}`;
  const runnerSpot = `92000000-0000-4000-8000-${String(16).padStart(12, "0")}`;
  spotUuidByKey.set("placement-champion", championSpot);
  spotUuidByKey.set("placement-runner-up", runnerSpot);
  spots.push(
    {
      ...spot(championSpot, "placement-champion", 14, null, 4, 1),
      kind: "placement",
      label: "Campeão",
      placementRank: 1,
    },
    {
      ...spot(runnerSpot, "placement-runner-up", 15, null, 4, 2),
      kind: "placement",
      label: "Vice-campeão",
      placementRank: 2,
    },
  );
  const routes = routeDefinitions.map(
    ([sourceKey, sourceOutcome, destinationKey, condition], index) => ({
      uuid: `93000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      sourceKind: "match-outcome" as const,
      sourceMatchUuid: matchUuid(sourceKey),
      sourceGroupUuid: null,
      sourceOutcome,
      sourceRank: null,
      condition,
      destinationSpotUuid: spotUuidByKey.get(destinationKey)!,
      priority: 0,
      state: "active" as const,
      createdAt: now,
      updatedAt: now,
    }),
  );

  data.teams.items = teams;
  data.format.stages.items[0] = {
    ...data.format.stages.items[0]!,
    name: "Dupla eliminação",
    engine: "double-elimination",
    config: {
      bracketSize: 4,
      teamCount: 4,
      grandFinalReset: true,
      winnersRoundCount: 2,
      losersRoundCount: 2,
    },
  };
  data.format.spots = {
    items: spots,
    totalCount: spots.length,
    truncated: false,
  };
  data.format.matches = {
    items: matches,
    totalCount: matches.length,
    truncated: false,
  };
  data.format.routes = {
    items: routes,
    totalCount: routes.length,
    truncated: false,
  };
  data.format.competitionRounds.items = data.format.competitionRounds.items.slice(0, 5);

  return data;
}

function spot(
  uuid: string,
  key: string,
  displayOrder: number,
  team: {
    uuid: string;
    name: string;
    abbreviation: string | null;
    colors: string[] | null;
  } | null,
  x: number,
  y: number,
) {
  return {
    uuid,
    stageUuid: "50000000-0000-4000-8000-000000000001",
    groupUuid: null,
    key,
    label: key,
    kind: "match-side" as const,
    displayOrder,
    placementRank: null,
    currentTeam: teamReference(team),
    x,
    y,
    revision: 1,
    createdAt: "2026-08-01T18:00:00.000Z",
    updatedAt: "2026-08-01T18:00:00.000Z",
  };
}

function teamReference(
  team: {
    uuid: string;
    name: string;
    abbreviation: string | null;
    colors: string[] | null;
  } | null,
) {
  return team
    ? {
        uuid: team.uuid,
        name: team.name,
        abbreviation: team.abbreviation,
        colors: team.colors,
      }
    : null;
}
