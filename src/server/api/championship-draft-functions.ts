import { notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uuid = z.string().uuid();
const commandUuid = z.string().uuid();
const draftCommand = z.object({
  championshipUuid: uuid,
  commandUuid,
  expectedRevision: z.number().int().min(0),
  expectedDraftRevision: z.number().int().min(0),
});
const tradeDecision = z.object({
  championshipUuid: uuid,
  tradeUuid: uuid,
  commandUuid,
  expectedRevision: z.number().int().min(0),
  expectedTradeRevision: z.number().int().min(0),
  reason: z.string().trim().min(1).max(1_000).optional(),
});

export const getChampionshipDraftFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      turnLimit: z.number().int().min(1).max(100).default(100),
      turnCursor: z.string().min(1).optional(),
      participantLimit: z.number().int().min(1).max(100).default(100),
      participantCursor: z.string().min(1).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireChampionshipFeature();
    const { getCurrentSession } = await import("#/server/auth/session");
    const { getChampionshipDraftProjection } = await import("#/server/api/championship-api");
    const session = await getCurrentSession();
    const { championshipUuid, ...query } = data;

    return getChampionshipDraftProjection(championshipUuid, {
      ...query,
      ...(session ? { actorAccountUuid: session.account.uuid } : {}),
    });
  });

export const getChampionshipTradesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      visibility: z.enum(["public", "involved", "admin"]).default("public"),
      state: z.enum(["proposed", "accepted", "rejected", "canceled", "expired"]).optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: z.string().min(1).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireChampionshipFeature();
    const { getCurrentSession } = await import("#/server/auth/session");
    const { getChampionshipTradesProjection } = await import("#/server/api/championship-api");
    const session = await getCurrentSession();
    const visibility = session ? data.visibility : "public";
    const { championshipUuid, ...query } = data;

    return getChampionshipTradesProjection(championshipUuid, {
      ...query,
      visibility,
      ...(session ? { actorAccountUuid: session.account.uuid } : {}),
    });
  });

export const configureChampionshipDraftFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      commandUuid,
      expectedRevision: z.number().int().min(0),
      teamIds: z.array(uuid).min(2).max(64),
      rounds: z.number().int().min(1).max(100),
      countdownSeconds: z.number().int().min(0).max(3_600),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { configureChampionshipDraft } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return configureChampionshipDraft(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const startChampionshipDraftFn = createServerFn({ method: "POST" })
  .inputValidator(draftCommand)
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { startChampionshipDraft } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return startChampionshipDraft(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const makeChampionshipDraftPickFn = createServerFn({ method: "POST" })
  .inputValidator(
    draftCommand.extend({
      participantId: uuid,
      teamId: uuid.optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAccount();
    const { makeChampionshipDraftPick } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return makeChampionshipDraftPick(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const endChampionshipDraftFn = createServerFn({ method: "POST" })
  .inputValidator(draftCommand.extend({ reason: z.string().trim().min(1).max(1_000) }))
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { endChampionshipDraft } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return endChampionshipDraft(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const previewChampionshipDraftCorrectionFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ championshipUuid: uuid, turnUuid: uuid }))
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { previewChampionshipDraftCorrection } = await import("#/server/api/championship-api");

    return previewChampionshipDraftCorrection(
      data.championshipUuid,
      data.turnUuid,
      session.account.uuid,
    );
  });

export const reverseChampionshipDraftPickFn = createServerFn({ method: "POST" })
  .inputValidator(
    draftCommand.extend({
      turnUuid: uuid,
      reason: z.string().trim().min(1).max(1_000),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipOperator();
    const { reverseChampionshipDraftPick } = await import("#/server/api/championship-api");
    const { championshipUuid, turnUuid, ...input } = data;

    return reverseChampionshipDraftPick(championshipUuid, turnUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const createChampionshipTradeFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      commandUuid,
      expectedRevision: z.number().int().min(0),
      proposingTeamId: uuid,
      receivingTeamId: uuid,
      proposingParticipantIds: z.array(uuid).min(1).max(32),
      receivingParticipantIds: z.array(uuid).min(1).max(32),
      deadlineAt: z.string().datetime().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await requireChampionshipAccount();
    const { createChampionshipTrade } = await import("#/server/api/championship-api");
    const { championshipUuid, ...input } = data;

    return createChampionshipTrade(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const acceptChampionshipTradeFn = createServerFn({ method: "POST" })
  .inputValidator(tradeDecision)
  .handler(async ({ data }) => {
    const session = await requireChampionshipAccount();
    const { decideChampionshipTrade } = await import("#/server/api/championship-api");
    const { championshipUuid, tradeUuid, ...input } = data;

    return decideChampionshipTrade(championshipUuid, tradeUuid, "accept", {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const rejectChampionshipTradeFn = createServerFn({ method: "POST" })
  .inputValidator(tradeDecision)
  .handler(async ({ data }) => {
    const session = await requireChampionshipAccount();
    const { decideChampionshipTrade } = await import("#/server/api/championship-api");
    const { championshipUuid, tradeUuid, ...input } = data;

    return decideChampionshipTrade(championshipUuid, tradeUuid, "reject", {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });

export const cancelChampionshipTradeFn = createServerFn({ method: "POST" })
  .inputValidator(tradeDecision)
  .handler(async ({ data }) => {
    const session = await requireChampionshipAccount();
    const { decideChampionshipTrade } = await import("#/server/api/championship-api");
    const { championshipUuid, tradeUuid, ...input } = data;

    return decideChampionshipTrade(championshipUuid, tradeUuid, "cancel", {
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

async function requireChampionshipAccount() {
  await requireChampionshipFeature();
  const { getCurrentSession } = await import("#/server/auth/session");
  const session = await getCurrentSession();

  if (!session) {
    throw redirect({ to: "/account/login" });
  }

  return session;
}

async function requireChampionshipOperator() {
  await requireChampionshipFeature();
  const { requireAnyApiPermission } = await import("#/server/auth/session");

  return requireAnyApiPermission(["championship:admin", "championship:operate"]);
}
