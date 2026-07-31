import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uuid = z.string().uuid();
const commandUuid = z.string().uuid();
const command = z.object({
  championshipUuid: uuid,
  commandUuid,
  expectedRevision: z.number().int().min(0),
});

export const getChampionshipFormatFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      limit: z.number().int().min(1).max(500).default(500),
    }),
  )
  .handler(async ({ data }) => {
    await requireChampionshipFeature();
    const { getCurrentSession } = await import("#/server/auth/session");
    const { getChampionshipFormatProjection } = await import("#/server/api/championship-api");
    const session = await getCurrentSession();

    return getChampionshipFormatProjection(data.championshipUuid, {
      limit: data.limit,
      ...(session ? { actorAccountUuid: session.account.uuid } : {}),
    });
  });

export const createChampionshipStageFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      name: z.string().trim().min(1).max(120),
      engine: z.enum(["manual", "single-elimination", "double-elimination", "standings"]),
      displayOrder: z.number().int().min(0).optional(),
      config: z.record(z.string(), z.unknown()).optional(),
      defaultRoomProgramId: uuid.nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { createChampionshipStage } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createChampionshipStage(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateChampionshipStageFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      stageUuid: uuid,
      expectedStageRevision: z.number().int().min(0),
      name: z.string().trim().min(1).max(120).optional(),
      state: z.enum(["draft", "active", "completed"]).optional(),
      config: z.record(z.string(), z.unknown()).optional(),
      defaultRoomProgramId: uuid.nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { updateChampionshipStage } = await import("#/server/api/championship-api");
    const { championshipUuid, stageUuid, ...input } = data;

    return updateChampionshipStage(championshipUuid, stageUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipGroupFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      stageUuid: uuid,
      expectedStageRevision: z.number().int().min(0),
      name: z.string().trim().min(1).max(120),
      displayOrder: z.number().int().min(0).optional(),
      teamIds: z.array(uuid).max(64).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { createChampionshipGroup } = await import("#/server/api/championship-api");
    const { championshipUuid, stageUuid, ...input } = data;

    return createChampionshipGroup(championshipUuid, stageUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

const standingsCriterion = z.enum([
  "points",
  "wins",
  "score-difference",
  "score-for",
  "score-against",
  "head-to-head",
  "head-to-head-points",
  "head-to-head-score-difference",
  "manual",
]);

export const configureChampionshipStandingsFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    command.extend({
      stageUuid: uuid,
      expectedStageRevision: z.number().int().min(0),
      scoring: z.object({
        win: z.number().int().min(-100).max(100),
        draw: z.number().int().min(-100).max(100),
        loss: z.number().int().min(-100).max(100),
      }),
      headToHeadRestart: z.enum(["continue", "restart-for-subgroup"]),
      rules: z
        .array(
          z.object({
            criterion: standingsCriterion,
            direction: z.enum(["asc", "desc"]),
            config: z.record(z.string(), z.unknown()).nullable().optional(),
          }),
        )
        .min(1)
        .max(20),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { configureChampionshipStandings } = await import("#/server/api/championship-api");
    const { championshipUuid, stageUuid, ...input } = data;

    return configureChampionshipStandings(championshipUuid, stageUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const getChampionshipStandingsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      stageUuid: uuid,
      groupUuid: uuid,
    }),
  )
  .handler(async ({ data }) => {
    await requireChampionshipFeature();
    const { getCurrentSession } = await import("#/server/auth/session");
    const { getChampionshipStandingsProjection } = await import("#/server/api/championship-api");
    const session = await getCurrentSession();

    return getChampionshipStandingsProjection(
      data.championshipUuid,
      data.stageUuid,
      data.groupUuid,
      session ? { actorAccountUuid: session.account.uuid } : undefined,
    );
  });

const roundRobinConfiguration = {
  sameGroupMeetings: z.number().int().min(0).max(20),
  crossGroupMeetings: z.number().int().min(0).max(20),
  pairOverrides: z
    .array(
      z.object({
        groupAId: uuid,
        groupBId: uuid,
        meetings: z.number().int().min(0).max(20),
      }),
    )
    .max(100)
    .optional(),
  assignCompetitionRounds: z.boolean().optional(),
};

export const previewChampionshipRoundRobinFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      stageUuid: uuid,
      ...roundRobinConfiguration,
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { previewChampionshipRoundRobin } = await import("#/server/api/championship-api");
    const { championshipUuid, stageUuid, ...input } = data;

    return previewChampionshipRoundRobin(championshipUuid, stageUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const generateChampionshipRoundRobinFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    command.extend({
      stageUuid: uuid,
      expectedStageRevision: z.number().int().min(0),
      ...roundRobinConfiguration,
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { generateChampionshipRoundRobin } = await import("#/server/api/championship-api");
    const { championshipUuid, stageUuid, ...input } = data;

    return generateChampionshipRoundRobin(championshipUuid, stageUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const previewChampionshipClassificationFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      stageUuid: uuid,
      groupUuid: uuid,
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { previewChampionshipClassification } = await import("#/server/api/championship-api");

    return previewChampionshipClassification(
      data.championshipUuid,
      data.stageUuid,
      data.groupUuid,
      { actorAccountUuid: session.account.uuid },
    );
  });

export const applyChampionshipClassificationFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    command.extend({
      stageUuid: uuid,
      groupUuid: uuid,
      expectedStageRevision: z.number().int().min(0),
      confirmedImpactMatchUuids: z.array(uuid).max(500),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { applyChampionshipClassification } = await import("#/server/api/championship-api");
    const { championshipUuid, stageUuid, groupUuid, ...input } = data;

    return applyChampionshipClassification(championshipUuid, stageUuid, groupUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const generateChampionshipSingleEliminationFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    command.extend({
      name: z.string().trim().min(1).max(120),
      teamIds: z.array(uuid).min(2).max(64),
      createCompetitionRounds: z.boolean().optional(),
      competitionRoundMode: z.enum(["per-bracket-round", "single-period"]).optional(),
      firstRoundStartsAt: z.string().datetime().nullable().optional(),
      roundDurationHours: z
        .number()
        .int()
        .min(1)
        .max(24 * 31)
        .optional(),
      defaultRoomProgramId: uuid.nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { generateChampionshipSingleElimination } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return generateChampionshipSingleElimination(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

const doubleEliminationConfiguration = {
  teamIds: z.array(uuid).min(2).max(64),
  grandFinalReset: z.boolean(),
};

export const previewChampionshipDoubleEliminationFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      ...doubleEliminationConfiguration,
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { previewChampionshipDoubleElimination } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return previewChampionshipDoubleElimination(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const generateChampionshipDoubleEliminationFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    command.extend({
      name: z.string().trim().min(1).max(120),
      ...doubleEliminationConfiguration,
      createCompetitionRounds: z.boolean().optional(),
      competitionRoundMode: z.enum(["per-bracket-round", "single-period"]).optional(),
      firstRoundStartsAt: z.string().datetime().nullable().optional(),
      roundDurationHours: z
        .number()
        .int()
        .min(1)
        .max(24 * 31)
        .optional(),
      defaultRoomProgramId: uuid.nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { generateChampionshipDoubleElimination } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return generateChampionshipDoubleElimination(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipSpotFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      stageId: uuid,
      groupId: uuid.nullable().optional(),
      key: z.string().trim().min(1).max(120),
      label: z.string().trim().min(1).max(160),
      kind: z.enum(["seed", "group-entry", "match-side", "qualification", "placement", "manual"]),
      displayOrder: z.number().int().min(0).optional(),
      placementRank: z.number().int().min(1).max(1_000).nullable().optional(),
      teamId: uuid.nullable().optional(),
      x: z.number().int().nullable().optional(),
      y: z.number().int().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { createChampionshipSpot } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createChampionshipSpot(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const placeChampionshipSpotFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      spotUuid: uuid,
      expectedSpotRevision: z.number().int().min(0),
      teamId: uuid.nullable(),
      sourceSpotId: uuid.nullable().optional(),
      expectedSourceSpotRevision: z.number().int().min(0).nullable().optional(),
      confirmedImpactMatchUuids: z.array(uuid).max(500),
      reason: z.string().trim().min(1).max(1_000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { placeChampionshipSpot } = await import("#/server/api/championship-api");
    const { championshipUuid, spotUuid, ...input } = data;

    return placeChampionshipSpot(championshipUuid, spotUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const previewChampionshipSpotPlacementFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      spotUuid: uuid,
      teamId: uuid.nullable(),
      sourceSpotId: uuid.nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { previewChampionshipSpotPlacement } = await import("#/server/api/championship-api");
    const { championshipUuid, spotUuid, ...input } = data;

    return previewChampionshipSpotPlacement(championshipUuid, spotUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipRouteFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      sourceKind: z.enum(["match-outcome", "classification-rank", "manual"]),
      sourceMatchId: uuid.nullable().optional(),
      sourceGroupId: uuid.nullable().optional(),
      sourceOutcome: z.enum(["winner", "loser", "rank"]).nullable().optional(),
      sourceRank: z.number().int().min(1).nullable().optional(),
      condition: z.enum(["always", "if-side-a-wins", "if-side-b-wins"]).optional(),
      destinationSpotId: uuid,
      priority: z.number().int().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { createChampionshipRoute } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createChampionshipRoute(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateChampionshipRouteFn = createServerFn({ method: "POST" })
  .inputValidator(command.extend({ routeUuid: uuid, state: z.enum(["active", "disabled"]) }))
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { updateChampionshipRoute } = await import("#/server/api/championship-api");
    const { championshipUuid, routeUuid, ...input } = data;

    return updateChampionshipRoute(championshipUuid, routeUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipCompetitionRoundFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    command.extend({
      stageId: uuid.nullable().optional(),
      name: z.string().trim().min(1).max(120),
      sequence: z.number().int().min(1),
      startsAt: z.string().datetime().nullable().optional(),
      endsAt: z.string().datetime().nullable().optional(),
      schedulingAuthority: z.enum(["staff", "gms", "staff-and-gms"]).nullable().optional(),
      latePlayPolicy: z.enum(["forbidden", "staff-approval", "allowed"]).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { createChampionshipCompetitionRound } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createChampionshipCompetitionRound(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipLogicalMatchFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    command.extend({
      stageId: uuid,
      groupId: uuid.nullable().optional(),
      label: z.string().trim().min(1).max(160),
      displayOrder: z.number().int().min(0).optional(),
      sideASpotId: uuid,
      sideBSpotId: uuid,
      competitionRoundId: uuid.nullable().optional(),
      scheduledAt: z.string().datetime().nullable().optional(),
      roomProgramId: uuid.nullable().optional(),
      matchRulesOverride: z.record(z.string(), z.unknown()).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { createChampionshipLogicalMatch } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createChampionshipLogicalMatch(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const scheduleChampionshipLogicalMatchFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    command.extend({
      matchUuid: uuid,
      expectedMatchRevision: z.number().int().min(0),
      competitionRoundId: uuid.nullable().optional(),
      scheduledAt: z.string().datetime().nullable(),
      scheduleStatus: z.enum(["unscheduled", "scheduled", "late-authorized", "canceled"]),
      roomProgramId: uuid.nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { scheduleChampionshipLogicalMatch } = await import("#/server/api/championship-api");
    const { championshipUuid, matchUuid, ...input } = data;

    return scheduleChampionshipLogicalMatch(championshipUuid, matchUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const getChampionshipMatchSchedulingFn = createServerFn({
  method: "GET",
})
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      matchUuid: uuid,
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipSession();
    const { getChampionshipMatchScheduling } = await import("#/server/api/championship-api");

    return getChampionshipMatchScheduling(data.championshipUuid, data.matchUuid, {
      actorAccountUuid: session.account.uuid,
      limit: 100,
    });
  });

export const createChampionshipScheduleProposalFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    command.extend({
      matchUuid: uuid,
      expectedMatchScheduleRevision: z.number().int().min(0),
      parentProposalId: uuid.nullable().optional(),
      expectedParentProposalRevision: z.number().int().min(0).nullable().optional(),
      mode: z.enum(["exact-time", "availability-range"]),
      exactTime: z.string().datetime().nullable().optional(),
      availableFrom: z.string().datetime().nullable().optional(),
      availableTo: z.string().datetime().nullable().optional(),
      note: z.string().trim().max(1_000).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipSession();
    const { createChampionshipScheduleProposal } = await import("#/server/api/championship-api");
    const { championshipUuid, matchUuid, ...input } = data;

    return createChampionshipScheduleProposal(championshipUuid, matchUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const decideChampionshipScheduleProposalFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    command.extend({
      matchUuid: uuid,
      proposalUuid: uuid,
      expectedMatchScheduleRevision: z.number().int().min(0),
      expectedProposalRevision: z.number().int().min(0),
      decision: z.enum(["accept", "reject", "withdraw"]),
      scheduledAt: z.string().datetime().nullable().optional(),
      reason: z.string().trim().max(1_000).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipSession();
    const { decideChampionshipScheduleProposal } = await import("#/server/api/championship-api");
    const { championshipUuid, matchUuid, proposalUuid, ...input } = data;

    return decideChampionshipScheduleProposal(championshipUuid, matchUuid, proposalUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const authorizeChampionshipLatePlayFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    command.extend({
      matchUuid: uuid,
      expectedMatchScheduleRevision: z.number().int().min(0),
      reason: z.string().trim().min(1).max(1_000),
      expiresAt: z.string().datetime().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { authorizeChampionshipLatePlay } = await import("#/server/api/championship-api");
    const { championshipUuid, matchUuid, ...input } = data;

    return authorizeChampionshipLatePlay(championshipUuid, matchUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const revokeChampionshipLatePlayFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      matchUuid: uuid,
      authorizationUuid: uuid,
      expectedAuthorizationRevision: z.number().int().min(0),
      reason: z.string().trim().min(1).max(1_000),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { revokeChampionshipLatePlay } = await import("#/server/api/championship-api");
    const { championshipUuid, matchUuid, authorizationUuid, ...input } = data;

    return revokeChampionshipLatePlay(championshipUuid, matchUuid, authorizationUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const remindChampionshipScheduleFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      matchUuid: uuid,
      note: z.string().trim().max(500).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipSession();
    const { remindChampionshipSchedule } = await import("#/server/api/championship-api");
    const { championshipUuid, matchUuid, ...input } = data;

    return remindChampionshipSchedule(championshipUuid, matchUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

async function requireChampionshipFeature() {
  const { getProductFeatures } = await import("#/server/features");

  if (!getProductFeatures().championships) {
    throw notFound();
  }
}

async function requireChampionshipSession() {
  await requireChampionshipFeature();
  const { getCurrentSession } = await import("#/server/auth/session");
  const session = await getCurrentSession();

  if (!session) {
    throw new Response("Entre para negociar o horário.", { status: 401 });
  }

  return session;
}

async function requireChampionshipOperator() {
  await requireChampionshipFeature();
  const { requireAnyApiPermission } = await import("#/server/auth/session");

  return requireAnyApiPermission(["championship:admin", "championship:operate"]);
}
