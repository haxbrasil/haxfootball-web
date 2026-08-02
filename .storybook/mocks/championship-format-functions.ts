async function unavailableInStorybook(): Promise<never> {
  throw new Error("Format mutations are not available in static stories.");
}

export const generateChampionshipSingleEliminationFn = unavailableInStorybook;
export const generateChampionshipDoubleEliminationFn = unavailableInStorybook;
export const previewChampionshipDoubleEliminationFn = unavailableInStorybook;
export const getChampionshipFormatFn = unavailableInStorybook;
export const createChampionshipCompetitionRoundFn = unavailableInStorybook;
export const createChampionshipGroupFn = unavailableInStorybook;
export const createChampionshipLogicalMatchFn = unavailableInStorybook;
export const createChampionshipRouteFn = unavailableInStorybook;
export const createChampionshipSpotFn = unavailableInStorybook;
export const createChampionshipStageFn = unavailableInStorybook;
export const deleteChampionshipStageFn = unavailableInStorybook;
export const configureChampionshipStandingsFn = unavailableInStorybook;
export const generateChampionshipRoundRobinFn = unavailableInStorybook;
export const applyChampionshipClassificationFn = unavailableInStorybook;
export const placeChampionshipSpotFn = unavailableInStorybook;
export const scheduleChampionshipLogicalMatchFn = unavailableInStorybook;
export const createChampionshipScheduleProposalFn = unavailableInStorybook;
export const decideChampionshipScheduleProposalFn = unavailableInStorybook;
export const authorizeChampionshipLatePlayFn = unavailableInStorybook;
export const revokeChampionshipLatePlayFn = unavailableInStorybook;
export const remindChampionshipScheduleFn = unavailableInStorybook;

export async function previewChampionshipRoundRobinFn() {
  return {
    ok: true as const,
    data: {
      championshipUuid: "10000000-0000-4000-8000-000000000001",
      stageUuid: "50000000-0000-4000-8000-000000000001",
      pairings: {
        items: [],
        totalCount: 30,
        truncated: false,
      },
      desiredMatchCount: 30,
      existingMatchCount: 18,
      missingMatchCount: 12,
      excessMatchCount: 0,
      canGenerate: true,
      generationBlockedReason: null,
      matchCountsByTeam: [],
    },
  };
}

export async function previewChampionshipClassificationFn() {
  return {
    ok: true as const,
    data: await getChampionshipStandingsFn(),
  };
}

export async function previewChampionshipSpotPlacementFn() {
  return {
    ok: true as const,
    data: {
      championshipUuid: "10000000-0000-4000-8000-000000000001",
      championshipRevision: 28,
      targetSpot: {
        uuid: "30000000-0000-4000-8000-000000000001",
        label: "Semifinal 1 · lado A",
        revision: 2,
        previousTeam: null,
        nextTeam: null,
      },
      sourceSpot: null,
      affectedMatches: [
        {
          matchUuid: "40000000-0000-4000-8000-000000000001",
          label: "Semifinal 1",
          depth: 1,
          hadResult: true,
          hadEvidence: true,
        },
        {
          matchUuid: "40000000-0000-4000-8000-000000000002",
          label: "Final",
          depth: 2,
          hadResult: true,
          hadEvidence: false,
        },
      ],
      requiresConfirmation: true,
    },
  };
}

export async function getChampionshipStandingsFn() {
  const teams = [
    ["20000000-0000-4000-8000-000000000001", "Aurora", "AUR", ["#10B981", "#111827"]],
    ["20000000-0000-4000-8000-000000000002", "Bravos", "BRA", ["#06B6D4", "#F59E0B"]],
    ["20000000-0000-4000-8000-000000000003", "Carbono", "CAR", ["#F43F5E", "#F8FAFC"]],
    ["20000000-0000-4000-8000-000000000004", "Dínamo", "DIN", ["#EAB308", "#1D4ED8"]],
    ["20000000-0000-4000-8000-000000000005", "Estrela", "EST", ["#A855F7", "#F8FAFC"]],
    ["20000000-0000-4000-8000-000000000006", "Fúria", "FUR", ["#EF4444", "#111827"]],
  ] as const;
  const records = [
    [15, 5, 5, 0, 0, 18, 5],
    [12, 5, 4, 0, 1, 13, 7],
    [9, 5, 3, 0, 2, 11, 8],
    [6, 5, 2, 0, 3, 8, 10],
    [6, 5, 2, 0, 3, 7, 10],
    [0, 5, 0, 0, 5, 2, 19],
  ] as const;

  return {
    championshipUuid: "10000000-0000-4000-8000-000000000001",
    championshipRevision: 28,
    stage: {
      uuid: "50000000-0000-4000-8000-000000000001",
      name: "Fase classificatória",
      revision: 4,
    },
    group: {
      uuid: "51000000-0000-4000-8000-000000000001",
      stageUuid: "50000000-0000-4000-8000-000000000001",
      name: "Grupo A",
      displayOrder: 0,
      createdAt: "2026-08-01T18:00:00.000Z",
      updatedAt: "2026-08-01T18:00:00.000Z",
    },
    scoring: { win: 3, draw: 1, loss: 0 },
    headToHeadRestart: "restart-for-subgroup",
    rules: [
      {
        uuid: "52000000-0000-4000-8000-000000000001",
        position: 0,
        criterion: "points",
        direction: "desc",
        config: null,
      },
      {
        uuid: "52000000-0000-4000-8000-000000000002",
        position: 1,
        criterion: "head-to-head-points",
        direction: "desc",
        config: null,
      },
      {
        uuid: "52000000-0000-4000-8000-000000000003",
        position: 2,
        criterion: "score-difference",
        direction: "desc",
        config: null,
      },
    ],
    rows: teams.map(([uuid, name, abbreviation, colors], index) => {
      const [points, played, wins, draws, losses, scoreFor, scoreAgainst] = records[index]!;
      const unresolvedTie = index === 3 || index === 4;
      return {
        rank: unresolvedTie ? 4 : index + 1,
        team: { uuid, name, abbreviation, colors: [...colors] },
        played,
        wins,
        draws,
        losses,
        points,
        scoreFor,
        scoreAgainst,
        scoreDifference: scoreFor - scoreAgainst,
        unresolvedTie,
        tieGroup: unresolvedTie ? "tie-4" : null,
        criteria: [
          { criterion: "points", value: points, scope: "overall" },
          {
            criterion: "head-to-head-points",
            value: unresolvedTie ? 3 : 0,
            scope: "head-to-head",
          },
          {
            criterion: "score-difference",
            value: scoreFor - scoreAgainst,
            scope: "overall",
          },
        ],
      };
    }),
    unresolvedTies: [
      {
        key: "tie-4",
        rankFrom: 4,
        rankTo: 5,
        teamUuids: [teams[3][0], teams[4][0]],
      },
    ],
    qualification: [
      {
        routeUuid: "53000000-0000-4000-8000-000000000001",
        rank: 1,
        destinationSpotUuid: "54000000-0000-4000-8000-000000000001",
        destinationSpotLabel: "Semifinal 1 · lado A",
        previousTeam: null,
        nextTeam: {
          uuid: teams[0][0],
          name: teams[0][1],
          abbreviation: teams[0][2],
          colors: [...teams[0][3]],
        },
        changed: true,
        blocked: false,
        reason: null,
      },
      {
        routeUuid: "53000000-0000-4000-8000-000000000002",
        rank: 4,
        destinationSpotUuid: "54000000-0000-4000-8000-000000000002",
        destinationSpotLabel: "Repescagem · lado B",
        previousTeam: null,
        nextTeam: null,
        changed: false,
        blocked: true,
        reason: "Rank 4 is inside an unresolved tie",
      },
    ],
    affectedMatches: [],
    canApply: false,
    latestRun: null,
  };
}

export async function getChampionshipMatchSchedulingFn() {
  return {
    championshipRevision: 14,
    actor: {
      access: "gm",
      team: {
        uuid: "20000000-0000-4000-8000-000000000001",
        name: "Aurora",
        abbreviation: "AUR",
      },
      canPropose: true,
      canIntervene: false,
    },
    match: {
      uuid: "40000000-0000-4000-8000-000000000001",
      label: "Quartas 1",
      sideA: {
        uuid: "20000000-0000-4000-8000-000000000001",
        name: "Aurora",
        abbreviation: "AUR",
      },
      sideB: {
        uuid: "20000000-0000-4000-8000-000000000008",
        name: "Horizonte",
        abbreviation: "HOR",
      },
      scheduledAt: null,
      scheduleStatus: "proposed",
      scheduleRevision: 2,
      revision: 2,
    },
    competitionRound: {
      uuid: "50000000-0000-4000-8000-000000000001",
      name: "Quartas de final",
      startsAt: "2026-08-03T18:00:00.000Z",
      endsAt: "2026-08-10T02:59:59.000Z",
      schedulingAuthority: "staff-and-gms",
      latePlayPolicy: "staff-approval",
    },
    proposalMode: "both",
    proposals: {
      items: [
        {
          uuid: "60000000-0000-4000-8000-000000000001",
          parentProposalUuid: null,
          proposingTeam: {
            uuid: "20000000-0000-4000-8000-000000000002",
            name: "Bravos",
            abbreviation: "BRA",
          },
          proposer: {
            accountUuid: "70000000-0000-4000-8000-000000000001",
            name: "GM Bravos",
          },
          mode: "availability-range",
          exactTime: null,
          availableFrom: "2026-08-07T22:00:00.000Z",
          availableTo: "2026-08-08T01:00:00.000Z",
          state: "pending",
          note: "Sexta à noite funciona melhor para o elenco.",
          decidedBy: null,
          decidedAt: null,
          revision: 0,
          createdAt: "2026-08-02T20:00:00.000Z",
          updatedAt: "2026-08-02T20:00:00.000Z",
        },
      ],
      total: 1,
      truncated: false,
    },
    lateAuthorizations: {
      items: [],
      total: 0,
      truncated: false,
    },
  };
}
