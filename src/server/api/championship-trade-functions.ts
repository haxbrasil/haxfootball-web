import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uuid = z.string().uuid();

export const updateChampionshipTradeWindowFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      championshipUuid: uuid,
      commandUuid: uuid,
      expectedRevision: z.number().int().min(0),
      state: z.enum(["open", "closed"]),
      reason: z.string().trim().min(1).max(1_000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAnyApiPermission } = await import("#/server/auth/session");
    const { updateChampionshipTradeWindow } = await import("#/server/api/championship-api");
    const session = await requireAnyApiPermission(["championship:admin", "championship:operate"]);
    const { championshipUuid, ...input } = data;

    return updateChampionshipTradeWindow(championshipUuid, {
      ...input,
      actorAccountUuid: session.account.uuid,
    });
  });
