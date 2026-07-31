import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uuid = z.string().uuid();
const physicalMatchId = z.string().regex(/^[a-z2-9]{8}$/);
const matchContext = z.object({
  championshipUuid: uuid,
  championshipMatchUuid: uuid,
});
const command = matchContext.extend({
  commandUuid: uuid,
  expectedRevision: z.number().int().min(0),
});
const attribution = z
  .object({
    sourcePlayerId: z.string().trim().min(1).max(160),
    mode: z.enum(["default", "exclude", "redirect"]),
    targetParticipantUuid: uuid.nullable().optional(),
    reason: z.string().trim().min(1).max(1_000).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.mode === "redirect" && !value.targetParticipantUuid) {
      context.addIssue({
        code: "custom",
        path: ["targetParticipantUuid"],
        message: "O redirecionamento exige um participante de destino.",
      });
    }
  });
const settlement = z.object({
  method: z.enum([
    "played",
    "manual",
    "full-forfeit",
    "mid-game-forfeit",
    "double-forfeit",
    "historical",
  ]),
  sideAPlayedScore: z.number().int().min(0),
  sideBPlayedScore: z.number().int().min(0),
  sideAAdministrativeScore: z.number().int().min(0).optional(),
  sideBAdministrativeScore: z.number().int().min(0).optional(),
  sideAOutcome: z.enum(["win", "loss", "draw"]),
  sideBOutcome: z.enum(["win", "loss", "draw"]),
  evidenceQualityReviewed: z.boolean(),
  programMismatchReason: z.string().trim().min(1).max(1_000).nullable().optional(),
  note: z.string().trim().min(1).max(2_000).nullable().optional(),
  attributions: z.array(attribution).max(500).optional(),
});

export const getChampionshipMatchOperationsFn = createServerFn({ method: "GET" })
  .inputValidator(matchContext)
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { getChampionshipMatchOperations } = await import("#/server/api/championship-api");

    return getChampionshipMatchOperations(data.championshipUuid, data.championshipMatchUuid, {
      actorAccountUuid: session.account.uuid,
    });
  });

export const listChampionshipEvidenceCandidatesFn = createServerFn({ method: "GET" })
  .inputValidator(
    matchContext.extend({
      logicalMatchId: z.string().trim().min(8).max(9).optional(),
      playerSearch: z.string().trim().min(1).max(120).optional(),
      initiatedFrom: z.string().datetime().optional(),
      initiatedTo: z.string().datetime().optional(),
      minimumTotalScore: z.number().int().min(0).optional(),
      maximumTotalScore: z.number().int().min(0).optional(),
      quality: z.enum(["complete", "recovered", "partial", "legacy"]).optional(),
      claimState: z.enum(["available", "claimed", "all"]).optional(),
      includeAllPrograms: z.boolean().optional(),
      limit: z.number().int().min(1).max(50).default(25),
      cursor: z.string().min(1).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { listChampionshipEvidenceCandidates } = await import("#/server/api/championship-api");
    const { championshipUuid, championshipMatchUuid, ...query } = data;

    return listChampionshipEvidenceCandidates(championshipUuid, championshipMatchUuid, {
      ...query,
      actorAccountUuid: session.account.uuid,
    });
  });

export const attachChampionshipMatchEvidenceFn = createServerFn({ method: "POST" })
  .inputValidator(
    command
      .extend({
        expectedEvidenceRevision: z.number().int().min(0),
        logicalMatchId: z.string().trim().min(8).max(9).optional(),
        composition: z
          .object({
            rounds: z
              .array(
                z.discriminatedUnion("kind", [
                  z.object({
                    kind: z.literal("sequential"),
                    number: z.number().int().min(1),
                    matchId: physicalMatchId,
                    orientation: z.enum(["aligned", "swapped"]),
                  }),
                  z.object({
                    kind: z.literal("extra-time"),
                    number: z.null(),
                    matchId: physicalMatchId,
                    orientation: z.enum(["aligned", "swapped"]),
                  }),
                ]),
              )
              .min(2)
              .max(10),
          })
          .optional(),
        orientation: z.enum(["aligned", "swapped"]),
        note: z.string().trim().min(1).max(1_000).nullable().optional(),
      })
      .superRefine((value, context) => {
        if (!!value.logicalMatchId === !!value.composition) {
          context.addIssue({
            code: "custom",
            path: ["logicalMatchId"],
            message: "Selecione uma partida ou monte uma composição de tempos.",
          });
        }
      }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { attachChampionshipMatchEvidence } = await import("#/server/api/championship-api");
    const { championshipUuid, championshipMatchUuid, ...input } = data;

    return attachChampionshipMatchEvidence(championshipUuid, championshipMatchUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const detachChampionshipMatchEvidenceFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      expectedEvidenceRevision: z.number().int().min(0),
      reason: z.string().trim().min(1).max(1_000),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { detachChampionshipMatchEvidence } = await import("#/server/api/championship-api");
    const { championshipUuid, championshipMatchUuid, ...input } = data;

    return detachChampionshipMatchEvidence(championshipUuid, championshipMatchUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const previewChampionshipMatchSettlementFn = createServerFn({ method: "POST" })
  .inputValidator(matchContext.extend({ correction: z.boolean(), settlement }))
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { previewChampionshipMatchSettlement } = await import("#/server/api/championship-api");

    return previewChampionshipMatchSettlement(
      data.championshipUuid,
      data.championshipMatchUuid,
      {
        ...data.settlement,
        actorAccountUuid: session.account.uuid,
      },
      data.correction,
    );
  });

export const settleChampionshipMatchFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      correction: z.boolean(),
      expectedEvidenceRevision: z.number().int().min(0),
      expectedResultRevision: z.number().int().min(0),
      previewHash: z.string().min(1).max(160),
      settlement,
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { settleChampionshipMatch } = await import("#/server/api/championship-api");
    const {
      championshipUuid,
      championshipMatchUuid,
      correction,
      settlement: result,
      ...commandInput
    } = data;

    return settleChampionshipMatch(
      championshipUuid,
      championshipMatchUuid,
      {
        ...commandInput,
        ...result,
        actorAccountUuid: session.account.uuid,
      },
      correction,
    );
  });

export const updateChampionshipMatchAttributionsFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      expectedResultRevision: z.number().int().min(0),
      attributions: z.array(attribution).max(500),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { updateChampionshipMatchAttributions } = await import("#/server/api/championship-api");
    const { championshipUuid, championshipMatchUuid, ...input } = data;

    return updateChampionshipMatchAttributions(championshipUuid, championshipMatchUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const getChampionshipStatisticsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      limit: z.number().int().min(1).max(500).default(200),
      offset: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { getChampionshipStatistics } = await import("#/server/api/championship-api");
    const { championshipUuid, ...query } = data;

    return getChampionshipStatistics(championshipUuid, {
      ...query,
      actorAccountUuid: session.account.uuid,
    });
  });

export const listChampionshipMetricMappingsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      limit: z.number().int().min(1).max(500).default(200),
      offset: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { listChampionshipMetricMappings } = await import("#/server/api/championship-api");
    const { championshipUuid, ...query } = data;

    return listChampionshipMetricMappings(championshipUuid, {
      ...query,
      actorAccountUuid: session.account.uuid,
    });
  });

export const replaceChampionshipMetricMappingsFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      commandUuid: uuid,
      expectedRevision: z.number().int().min(0),
      mappings: z
        .array(
          z.object({
            eventSchemaId: uuid,
            eventSchemaVersion: z.number().int().min(1),
            sourceMetricKey: z.string().trim().min(1).max(120),
            canonicalMetricKey: z.string().trim().min(1).max(120),
            displayLabel: z.string().trim().min(1).max(160),
            valueKind: z.enum(["integer", "number", "duration", "percentage"]),
            aggregation: z.enum(["sum", "average", "maximum", "minimum"]),
          }),
        )
        .max(500),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { replaceChampionshipMetricMappings } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return replaceChampionshipMetricMappings(championshipUuid, {
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

async function requireChampionshipOperator() {
  await requireChampionshipFeature();
  const { requireAnyApiPermission } = await import("#/server/auth/session");

  return requireAnyApiPermission(["championship:admin", "championship:operate"]);
}
