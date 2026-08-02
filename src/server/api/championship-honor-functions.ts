import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uuid = z.string().uuid();
const recipientType = z.enum([
  "team",
  "team-identity",
  "participant",
  "account",
  "historical-player",
]);
const definitionFields = z
  .object({
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2_000).nullable().optional(),
    recipientTypes: z.array(recipientType).min(1).max(5),
    minimumRecipients: z.number().int().min(0).max(128),
    maximumRecipients: z.number().int().min(1).max(128),
    aggregateByIdentity: z.boolean(),
    presentation: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((value) => value.minimumRecipients <= value.maximumRecipients, {
    message: "O mínimo de vencedores não pode superar o máximo.",
    path: ["minimumRecipients"],
  });
const command = z.object({
  championshipUuid: uuid,
  commandUuid: uuid,
  expectedRevision: z.number().int().min(0),
});
const decisionPolicy = z.discriminatedUnion("type", [
  z.object({ type: z.literal("placement"), ranks: z.array(z.number().int().min(1)).min(1) }),
  z.object({
    type: z.literal("spot-result"),
    spotUuids: z.array(uuid).min(1),
    outcome: z.enum(["winner", "loser", "occupant"]),
  }),
  z.object({
    type: z.literal("metric-ranking"),
    metricKey: z.string().trim().min(1).max(160),
    direction: z.enum(["highest", "lowest"]),
    limit: z.number().int().min(1).max(128),
  }),
  z.object({ type: z.literal("staff-selection") }),
  z.object({ type: z.literal("hybrid"), note: z.string().trim().min(1).max(2_000) }),
]);

export const getChampionshipHonorCatalogFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireApiPermission } = await import("#/server/auth/session");
  const { listChampionshipHonorCatalog } = await import("#/server/api/championship-api");
  const session = await requireApiPermission("honor-definition:admin");
  return { data: await listChampionshipHonorCatalog(), session };
});

export const createChampionshipHonorDefinitionFn = createServerFn({ method: "POST" })
  .inputValidator(
    definitionFields.extend({
      competitionTypeId: uuid,
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      kind: z.enum(["title", "award"]),
    }),
  )
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { createChampionshipHonorDefinition } = await import("#/server/api/championship-api");
    const session = await requireApiPermission("honor-definition:admin");
    return createChampionshipHonorDefinition({ ...data, actorAccountUuid: session.account.uuid });
  });

export const updateChampionshipHonorDefinitionDraftFn = createServerFn({ method: "POST" })
  .inputValidator(
    definitionFields.extend({ definitionUuid: uuid, expectedRevision: z.number().int().min(0) }),
  )
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { updateChampionshipHonorDefinitionDraft } =
      await import("#/server/api/championship-api");
    const session = await requireApiPermission("honor-definition:admin");
    const { definitionUuid, ...input } = data;
    return updateChampionshipHonorDefinitionDraft(definitionUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const publishChampionshipHonorDefinitionFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ definitionUuid: uuid, expectedRevision: z.number().int().min(0) }))
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { publishChampionshipHonorDefinition } = await import("#/server/api/championship-api");
    const session = await requireApiPermission("honor-definition:admin");
    return publishChampionshipHonorDefinition(data.definitionUuid, {
      expectedRevision: data.expectedRevision,
      actorAccountUuid: session.account.uuid,
    });
  });

export const archiveChampionshipHonorDefinitionFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      definitionUuid: uuid,
      expectedRevision: z.number().int().min(0),
      archived: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { archiveChampionshipHonorDefinition } = await import("#/server/api/championship-api");
    const session = await requireApiPermission("honor-definition:admin");
    return archiveChampionshipHonorDefinition(data.definitionUuid, {
      archived: data.archived,
      expectedRevision: data.expectedRevision,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipHonorFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      definitionVersionUuid: uuid,
      state: z.enum(["draft", "announced"]).optional(),
      nameOverride: z.string().trim().max(160).nullable().optional(),
      descriptionOverride: z.string().trim().max(2_000).nullable().optional(),
      decisionPolicy,
      displayOrder: z.number().int().min(0).max(10_000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAnyApiPermission } = await import("#/server/auth/session");
    const { createChampionshipHonor } = await import("#/server/api/championship-api");
    const session = await requireAnyApiPermission(["championship:admin", "championship:operate"]);
    const { championshipUuid, ...input } = data;
    return createChampionshipHonor(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const updateChampionshipHonorFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      honorUuid: uuid,
      state: z.enum(["draft", "announced", "deciding", "void"]).optional(),
      nameOverride: z.string().trim().max(160).nullable().optional(),
      descriptionOverride: z.string().trim().max(2_000).nullable().optional(),
      decisionPolicy: decisionPolicy.optional(),
      displayOrder: z.number().int().min(0).max(10_000).optional(),
      reason: z.string().trim().min(3).max(2_000),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAnyApiPermission } = await import("#/server/auth/session");
    const { updateChampionshipHonor } = await import("#/server/api/championship-api");
    const session = await requireAnyApiPermission(["championship:admin", "championship:operate"]);
    const { championshipUuid, honorUuid, ...input } = data;
    return updateChampionshipHonor(championshipUuid, honorUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const reorderChampionshipHonorsFn = createServerFn({ method: "POST" })
  .inputValidator(command.extend({ honorUuids: z.array(uuid).min(1).max(128) }))
  .handler(async ({ data }) => {
    const { requireAnyApiPermission } = await import("#/server/auth/session");
    const { reorderChampionshipHonors } = await import("#/server/api/championship-api");
    const session = await requireAnyApiPermission(["championship:admin", "championship:operate"]);
    return reorderChampionshipHonors(data.championshipUuid, {
      ...data,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipHonorGrantFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      honorUuid: uuid,
      target: z.object({ type: recipientType, uuid }),
      rank: z.number().int().min(1).nullable().optional(),
      note: z.string().trim().max(2_000).nullable().optional(),
      reason: z.string().trim().min(3).max(2_000),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAnyApiPermission } = await import("#/server/auth/session");
    const { createChampionshipHonorGrant } = await import("#/server/api/championship-api");
    const session = await requireAnyApiPermission([
      "championship:admin",
      "championship-history:admin",
    ]);
    const { championshipUuid, honorUuid, ...input } = data;
    return createChampionshipHonorGrant(championshipUuid, honorUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const previewChampionshipHonorResolutionFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ championshipUuid: uuid, honorUuid: uuid }))
  .handler(async ({ data }) => {
    const { requireAnyApiPermission } = await import("#/server/auth/session");
    const { previewChampionshipHonorResolution } = await import("#/server/api/championship-api");
    const session = await requireAnyApiPermission(["championship:admin", "championship:operate"]);
    return previewChampionshipHonorResolution(
      data.championshipUuid,
      data.honorUuid,
      session.account.uuid,
    );
  });

export const resolveChampionshipHonorFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      honorUuid: uuid,
      reason: z.string().trim().min(3).max(2_000),
    }),
  )
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { resolveChampionshipHonor } = await import("#/server/api/championship-api");
    const session = await requireApiPermission("championship:admin");
    const { championshipUuid, honorUuid, ...input } = data;
    return resolveChampionshipHonor(championshipUuid, honorUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const revokeChampionshipHonorGrantFn = createServerFn({ method: "POST" })
  .inputValidator(
    command.extend({
      honorUuid: uuid,
      grantUuid: uuid,
      reason: z.string().trim().min(3).max(2_000),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAnyApiPermission } = await import("#/server/auth/session");
    const { revokeChampionshipHonorGrant } = await import("#/server/api/championship-api");
    const session = await requireAnyApiPermission([
      "championship:admin",
      "championship-history:admin",
    ]);
    const { championshipUuid, honorUuid, grantUuid, ...input } = data;
    return revokeChampionshipHonorGrant(championshipUuid, honorUuid, grantUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });
