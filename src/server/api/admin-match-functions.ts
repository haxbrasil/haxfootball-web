import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createMatchComposition,
  deleteMatchComposition,
  getMatchCompositionCandidate,
  listAdminMatches,
  updateMatchComposition,
} from "#/server/api/haxfootball";
import { requireApiPermission } from "#/server/auth/session";

const paginationInput = z
  .object({
    cursor: z.string().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .optional();

const matchIdInput = z.string().regex(/^[a-z2-9]{8}$/);
const composedMatchIdInput = z.string().regex(/^c[a-z2-9]{8}$/);

const roundInput = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("sequential"),
    number: z.number().int().min(1),
    matchId: matchIdInput,
  }),
  z.object({
    kind: z.literal("extra-time"),
    number: z.null(),
    matchId: matchIdInput,
  }),
]);

const compositionInput = z.object({
  id: composedMatchIdInput.optional(),
  rounds: z.array(roundInput).min(2),
});

export const listAdminMatchesFn = createServerFn({ method: "GET" })
  .inputValidator(paginationInput)
  .handler(async ({ data }) => {
    await requireApiPermission("match:admin");

    return listAdminMatches({ cursor: data?.cursor, limit: data?.limit ?? 50 });
  });

export const findMatchCompositionCandidateFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: matchIdInput }))
  .handler(async ({ data }) => {
    await requireApiPermission("match:admin");

    return getMatchCompositionCandidate(data.id);
  });

export const saveMatchCompositionFn = createServerFn({ method: "POST" })
  .inputValidator(compositionInput)
  .handler(async ({ data }) => {
    await requireApiPermission("match:admin");

    const composition = data.id
      ? await updateMatchComposition(data.id, { rounds: data.rounds })
      : await createMatchComposition({ rounds: data.rounds });

    return composition
      ? ({ ok: true, composition } as const)
      : ({ ok: false, message: "Não foi possível salvar a partida composta." } as const);
  });

export const unbindMatchCompositionFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: composedMatchIdInput }))
  .handler(async ({ data }) => {
    await requireApiPermission("match:admin");

    const deleted = await deleteMatchComposition(data.id);

    return deleted
      ? ({ ok: true } as const)
      : ({ ok: false, message: "Não foi possível desfazer a composição." } as const);
  });
