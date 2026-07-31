import { createServerFn } from "@tanstack/react-start";
import { notFound, redirect } from "@tanstack/react-router";
import { z } from "zod";

const uuid = z.string().uuid();
const commandUuid = z.string().uuid();
const championshipIdInput = z.object({ championshipUuid: uuid });
const slugInput = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});
const commandInput = z.object({
  championshipUuid: uuid,
  commandUuid,
  expectedRevision: z.number().int().min(0),
});
const rulesInput = z.object({
  match: z.object({
    sequentialRoundCount: z.number().int().min(1).max(8),
    switchSides: z.boolean(),
    drawPolicy: z.enum(["allowed", "overtime", "staff-decision"]),
    overtimePolicy: z.enum(["disabled", "separate-period", "manual"]),
    overtimeRuleLabel: z.string().nullable(),
    fullForfeitScore: z.object({
      winner: z.number().int().min(0),
      loser: z.number().int().min(0),
    }),
  }),
  roster: z.object({
    minimumSize: z.number().int().min(0),
    maximumSize: z.number().int().min(0),
    lockPolicy: z.enum(["unlocked", "draft-start", "competition-start"]),
  }),
  salary: z.object({
    enabled: z.boolean(),
    capUnits: z.number().int().min(0),
    displayLabel: z.string().min(1).max(24),
    maximumTradeDifference: z.number().int().min(0),
  }),
  draft: z.object({
    rounds: z.number().int().min(1).max(100),
    countdownSeconds: z.number().int().min(5).max(3_600),
    publicPrices: z.boolean(),
  }),
  scheduling: z.object({
    authority: z.enum(["staff", "gms", "staff-and-gms"]),
    proposalMode: z.enum(["exact-time", "availability-range", "both"]),
    latePlayPolicy: z.enum(["forbidden", "staff-approval", "allowed"]),
  }),
});

export const listPublicChampionshipsFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const { listPublicChampionships } = await import("#/server/api/championship-api");

  return listPublicChampionships();
});

export const getPublicChampionshipFn = createServerFn({ method: "GET" })
  .inputValidator(slugInput)
  .handler(async ({ data }) => {
    const { getCurrentSession } = await import("#/server/auth/session");
    const { getPublicChampionshipBySlug } = await import("#/server/api/championship-api");
    const session = await getCurrentSession();
    const championship = await getPublicChampionshipBySlug(data.slug, session?.account.uuid);

    if (!championship) {
      throw notFound();
    }

    return {
      data: championship,
      session,
    };
  });

export const listChampionshipAdminIndexFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const { requireAnyApiPermission } = await import("#/server/auth/session");
  const { listChampionshipAdminIndex } = await import("#/server/api/championship-api");

  await requireAnyApiPermission(["championship:admin", "championship:operate"]);

  return listChampionshipAdminIndex();
});

export const getChampionshipWorkspaceFn = createServerFn({ method: "GET" })
  .inputValidator(championshipIdInput)
  .handler(async ({ data }) => {
    const { requireAnyApiPermission } = await import("#/server/auth/session");
    const { getChampionshipWorkspace } = await import("#/server/api/championship-api");
    const session = await requireAnyApiPermission(["championship:admin", "championship:operate"]);
    const canManageHistory =
      session.account.role.bypassAllPermissions ||
      session.account.role.permissions.includes("*") ||
      session.account.role.permissions.includes("championship:admin") ||
      session.account.role.permissions.includes("championship-history:admin");

    return {
      data: await getChampionshipWorkspace(
        data.championshipUuid,
        session.account.uuid,
        canManageHistory,
      ),
      session,
    };
  });

const awardTargetInput = z.object({
  type: z.enum(["team", "team-identity", "participant", "account", "historical-player"]),
  uuid,
});

export const replaceChampionshipPlacementsFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    commandInput.extend({
      placements: z
        .array(
          z.object({
            teamUuid: uuid,
            rank: z.number().int().min(1).max(1_000),
          }),
        )
        .min(1)
        .max(128),
      source: z.enum(["format", "staff", "historical-import"]).optional(),
      reason: z.string().trim().min(3).max(2_000),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { replaceChampionshipPlacements } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return replaceChampionshipPlacements(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipAwardFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      kind: z.string().trim().min(1).max(80),
      rank: z.number().int().min(1).nullable().optional(),
      target: awardTargetInput,
      displayLabel: z.string().trim().min(1).max(160),
      note: z.string().max(2_000).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { createChampionshipAward } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createChampionshipAward(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateChampionshipAwardFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      awardUuid: uuid,
      kind: z.string().trim().min(1).max(80).optional(),
      rank: z.number().int().min(1).nullable().optional(),
      target: awardTargetInput.optional(),
      displayLabel: z.string().trim().min(1).max(160).optional(),
      note: z.string().max(2_000).nullable().optional(),
      reason: z.string().trim().min(3).max(2_000),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { updateChampionshipAward } = await import("#/server/api/championship-api");
    const { championshipUuid, awardUuid, ...input } = data;

    return updateChampionshipAward(championshipUuid, awardUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

const historicalImportEntityType = z.enum([
  "team-identity",
  "team",
  "historical-player",
  "participant",
  "roster-membership",
  "stage",
  "match",
  "statistic",
  "placement",
  "award",
  "record",
  "unknown",
]);

export const previewChampionshipHistoricalImportFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      format: z.enum(["csv", "json"]),
      sourceName: z.string().trim().min(1).max(255),
      source: z.string().min(1).max(5_000_000),
      mapping: z.object({
        entityTypeColumn: z.string().max(160).nullable().optional(),
        defaultEntityType: historicalImportEntityType.nullable().optional(),
        fieldMap: z.record(z.string().min(1).max(120), z.string().min(1).max(160)).optional(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipHistoryAdmin();
    const { previewChampionshipHistoricalImport } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return previewChampionshipHistoricalImport(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const applyChampionshipHistoricalImportFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    commandInput.extend({
      batchUuid: uuid,
      reason: z.string().trim().min(3).max(2_000),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipHistoryAdmin();
    const { applyChampionshipHistoricalImport } = await import("#/server/api/championship-api");
    const { championshipUuid, batchUuid, ...input } = data;

    return applyChampionshipHistoricalImport(championshipUuid, batchUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const rollbackChampionshipHistoricalImportFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    commandInput.extend({
      batchUuid: uuid,
      reason: z.string().trim().min(3).max(2_000),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipHistoryAdmin();
    const { rollbackChampionshipHistoricalImport } = await import("#/server/api/championship-api");
    const { championshipUuid, batchUuid, ...input } = data;

    return rollbackChampionshipHistoricalImport(championshipUuid, batchUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const linkChampionshipHistoricalPlayerFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    commandInput.extend({
      historicalPlayerUuid: uuid,
      accountUuid: uuid.nullable(),
      expectedLinkedAccountUuid: uuid.nullable().optional(),
      reason: z.string().trim().min(3).max(2_000),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipHistoryAdmin();
    const { linkChampionshipHistoricalPlayer } = await import("#/server/api/championship-api");
    const { championshipUuid, historicalPlayerUuid, ...input } = data;

    return linkChampionshipHistoricalPlayer(championshipUuid, historicalPlayerUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const getChampionshipSalaryWorkspacePageFn = createServerFn({
  method: "GET",
})
  .inputValidator(
    championshipIdInput.extend({
      participantCursor: z.string().min(1).optional(),
      teamCursor: z.string().min(1).optional(),
      participantLimit: z.number().int().min(1).max(100).optional(),
      teamLimit: z.number().int().min(1).max(100).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { getChampionshipSalaryWorkspacePage } = await import("#/server/api/championship-api");
    const { championshipUuid, ...query } = data;

    return getChampionshipSalaryWorkspacePage(championshipUuid, session.account.uuid, query);
  });

export const searchChampionshipAccountsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      search: z.string().trim().max(160).optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: z.string().min(1).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireChampionshipAdmin();
    const { searchChampionshipAccounts } = await import("#/server/api/championship-api");

    return searchChampionshipAccounts(data);
  });

export const createCompetitionTypeFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      commandUuid,
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      name: z.string().trim().min(1).max(120),
      description: z.string().max(2_000).nullable().optional(),
      cadence: z.enum(["long-running", "multi-day", "single-event"]).nullable().optional(),
      defaultRules: rulesInput,
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { createCompetitionType } = await import("#/server/api/championship-api");

    return createCompetitionType({
      ...data,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateCompetitionTypeFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      competitionTypeUuid: uuid,
      commandUuid,
      expectedRevision: z.number().int().min(0),
      name: z.string().trim().min(1).max(120).optional(),
      description: z.string().max(2_000).nullable().optional(),
      cadence: z.enum(["long-running", "multi-day", "single-event"]).nullable().optional(),
      defaultRules: rulesInput.optional(),
      state: z.enum(["active", "archived"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { updateCompetitionType } = await import("#/server/api/championship-api");
    const { competitionTypeUuid, ...input } = data;

    return updateCompetitionType(competitionTypeUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      commandUuid,
      competitionTypeId: uuid,
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      name: z.string().trim().min(1).max(160),
      editionLabel: z.string().max(80).nullable().optional(),
      description: z.string().max(4_000).nullable().optional(),
      startsAt: z.string().datetime().nullable().optional(),
      endsAt: z.string().datetime().nullable().optional(),
      historical: z.boolean().optional(),
      createCompleted: z.boolean().optional(),
      roomProgramIds: z.array(uuid).max(20).optional(),
      defaultRoomProgramId: uuid.optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { createChampionship } = await import("#/server/api/championship-api");

    return createChampionship({
      ...data,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateChampionshipFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      name: z.string().trim().min(1).max(160).optional(),
      editionLabel: z.string().max(80).nullable().optional(),
      description: z.string().max(4_000).nullable().optional(),
      startsAt: z.string().datetime().nullable().optional(),
      endsAt: z.string().datetime().nullable().optional(),
      rules: rulesInput.optional(),
      reason: z.string().max(1_000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { updateChampionship } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return updateChampionship(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const transitionChampionshipFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      transition: z.enum([
        "publish",
        "unpublish",
        "activate",
        "complete",
        "archive",
        "cancel",
        "delete",
      ]),
      reason: z.string().max(1_000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { transitionChampionship } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return transitionChampionship(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createTeamIdentityFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      name: z.string().trim().min(1).max(120),
      abbreviation: z.string().trim().min(1).max(12).nullable().optional(),
      colors: z
        .array(z.string().regex(/^#[0-9a-fA-F]{6}$/))
        .min(1)
        .max(4)
        .nullable()
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { createTeamIdentity } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createTeamIdentity(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateTeamIdentityFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      identityUuid: uuid,
      name: z.string().trim().min(1).max(120).optional(),
      abbreviation: z.string().trim().min(1).max(12).nullable().optional(),
      colors: z
        .array(z.string().regex(/^#[0-9a-fA-F]{6}$/))
        .min(1)
        .max(4)
        .nullable()
        .optional(),
      state: z.enum(["active", "archived"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { updateTeamIdentity } = await import("#/server/api/championship-api");
    const { championshipUuid, identityUuid, ...input } = data;

    return updateTeamIdentity(championshipUuid, identityUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipTeamFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      teamIdentityId: uuid.nullable().optional(),
      name: z.string().trim().min(1).max(120),
      abbreviation: z.string().trim().min(1).max(12).nullable().optional(),
      colors: z
        .array(z.string().regex(/^#[0-9a-fA-F]{6}$/))
        .min(1)
        .max(4)
        .nullable()
        .optional(),
      seed: z.number().int().min(1).nullable().optional(),
      displayOrder: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { createChampionshipTeam } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createChampionshipTeam(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateChampionshipTeamFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      teamUuid: uuid,
      teamIdentityId: uuid.nullable().optional(),
      name: z.string().trim().min(1).max(120).optional(),
      abbreviation: z.string().trim().min(1).max(12).nullable().optional(),
      colors: z
        .array(z.string().regex(/^#[0-9a-fA-F]{6}$/))
        .min(1)
        .max(4)
        .nullable()
        .optional(),
      seed: z.number().int().min(1).nullable().optional(),
      displayOrder: z.number().int().min(0).optional(),
      state: z.enum(["active", "withdrawn", "disqualified"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { updateChampionshipTeam } = await import("#/server/api/championship-api");
    const { championshipUuid, teamUuid, ...input } = data;

    return updateChampionshipTeam(championshipUuid, teamUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const transitionChampionshipRegistrationFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    commandInput.extend({
      operation: z.enum(["open", "close"]),
      reason: z.string().trim().min(1).max(1_000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { transitionChampionshipRegistration } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return transitionChampionshipRegistration(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const selfRegisterChampionshipFn = createServerFn({ method: "POST" })
  .inputValidator(commandInput)
  .handler(async ({ data }) => {
    const session = await requireChampionshipAccount();
    const { selfRegisterChampionship } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return selfRegisterChampionship(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const withdrawChampionshipRegistrationFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    commandInput.extend({
      reason: z.string().trim().min(1).max(1_000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAccount();
    const { withdrawChampionshipRegistration } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return withdrawChampionshipRegistration(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipParticipantFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    commandInput.extend({
      accountUuid: uuid,
      status: z.enum(["pending", "active"]).optional(),
      priceUnits: z.number().int().min(0).optional(),
      reason: z.string().trim().min(1).max(1_000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { createChampionshipParticipant } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createChampionshipParticipant(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateChampionshipParticipantFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    commandInput.extend({
      participantUuid: uuid,
      status: z.enum(["pending", "active", "withdrawn", "ineligible", "removed"]),
      priceUnits: z.number().int().min(0).optional(),
      reason: z.string().trim().min(1).max(1_000),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { updateChampionshipParticipant } = await import("#/server/api/championship-api");
    const { championshipUuid, participantUuid, ...input } = data;

    return updateChampionshipParticipant(championshipUuid, participantUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const upsertChampionshipPricesFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      prices: z
        .array(
          z.object({
            participantId: uuid,
            priceUnits: z.number().int().min(0),
          }),
        )
        .min(1)
        .max(500),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { upsertChampionshipPrices } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return upsertChampionshipPrices(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const freezeChampionshipPricesFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      reason: z.string().trim().min(1).max(1_000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { freezeChampionshipPrices } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return freezeChampionshipPrices(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const previewChampionshipRosterMoveFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      participantId: uuid,
      targetTeamId: uuid.nullable(),
      role: z.enum(["gm", "player"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { previewChampionshipRosterMove } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return previewChampionshipRosterMove(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const executeChampionshipRosterMoveFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    commandInput.extend({
      participantId: uuid,
      targetTeamId: uuid.nullable(),
      role: z.enum(["gm", "player"]).optional(),
      confirmCapException: z.boolean().optional(),
      reason: z.string().trim().min(1).max(1_000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { executeChampionshipRosterMove } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return executeChampionshipRosterMove(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const changeChampionshipRoomProgramFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    commandInput.extend({
      roomProgramId: uuid,
      operation: z.enum(["add", "set-default", "retire", "reactivate"]),
      replacementRoomProgramId: uuid.nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAdmin();
    const { changeChampionshipRoomProgram } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return changeChampionshipRoomProgram(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipThreadFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      contextType: z.string().trim().min(1).max(80),
      contextUuid: z.string().trim().min(1).max(120).nullable().optional(),
      title: z.string().trim().min(1).max(160).nullable().optional(),
      body: z.string().trim().min(1).max(8_000),
      mentionAccountUuids: z.array(uuid).max(50).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { createChampionshipThread } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createChampionshipThread(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const addChampionshipCommentFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      threadUuid: uuid,
      body: z.string().trim().min(1).max(8_000),
      mentionAccountUuids: z.array(uuid).max(50).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { addChampionshipComment } = await import("#/server/api/championship-api");
    const { championshipUuid, threadUuid, ...input } = data;

    return addChampionshipComment(championshipUuid, threadUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipAssignmentFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      assigneeAccountUuid: uuid,
      contextType: z.string().trim().min(1).max(80),
      contextUuid: z.string().trim().min(1).max(120).nullable().optional(),
      title: z.string().trim().min(1).max(160),
      description: z.string().max(4_000).nullable().optional(),
      dueAt: z.string().datetime().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { createChampionshipAssignment } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createChampionshipAssignment(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateChampionshipThreadFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      threadUuid: uuid,
      state: z.enum(["open", "resolved"]),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { updateChampionshipThread } = await import("#/server/api/championship-api");
    const { championshipUuid, threadUuid, ...input } = data;

    return updateChampionshipThread(championshipUuid, threadUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateChampionshipAssignmentFn = createServerFn({ method: "POST" })
  .inputValidator(
    commandInput.extend({
      assignmentUuid: uuid,
      state: z.enum(["open", "in-progress", "completed", "canceled"]),
      reason: z.string().trim().min(1).max(1_000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { updateChampionshipAssignment } = await import("#/server/api/championship-api");
    const { championshipUuid, assignmentUuid, ...input } = data;

    return updateChampionshipAssignment(championshipUuid, assignmentUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateChampionshipInboxItemFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      inboxItemUuid: uuid,
      operation: z.enum(["read", "unread", "archive"]),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { updateChampionshipInboxItem } = await import("#/server/api/championship-api");

    return updateChampionshipInboxItem(data.inboxItemUuid, {
      actorAccountUuid: session.account.uuid,
      operation: data.operation,
    });
  });

export const upsertChampionshipSavedViewFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      surface: z.string().trim().min(1).max(80),
      name: z.string().trim().min(1).max(120),
      state: z.object({
        view: z.enum([
          "setup",
          "teams",
          "salary",
          "draft",
          "format",
          "matches",
          "statistics",
          "archive",
          "activity",
        ]),
        inspector: z.boolean(),
      }),
      isDefault: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { upsertChampionshipSavedView } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return upsertChampionshipSavedView(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const heartbeatChampionshipPresenceFn = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      sessionUuid: uuid,
      contextType: z.string().trim().min(1).max(80).nullable().optional(),
      contextUuid: z.string().trim().min(1).max(120).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { heartbeatChampionshipPresence } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return heartbeatChampionshipPresence(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

async function requireChampionshipAdmin() {
  const { requireApiPermission } = await import("#/server/auth/session");

  return requireApiPermission("championship:admin");
}

async function requireChampionshipHistoryAdmin() {
  const { requireAnyApiPermission } = await import("#/server/auth/session");

  return requireAnyApiPermission(["championship:admin", "championship-history:admin"]);
}

async function requireChampionshipAccount() {
  const { getCurrentSession } = await import("#/server/auth/session");
  const session = await getCurrentSession();

  if (!session) {
    throw redirect({ to: "/account/login" });
  }

  return session;
}

async function requireChampionshipOperator() {
  const { requireAnyApiPermission } = await import("#/server/auth/session");

  return requireAnyApiPermission(["championship:admin", "championship:operate"]);
}
