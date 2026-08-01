import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getChampionshipVisualizationConfigurationFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ championshipId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAnyApiPermission } = await import("#/server/auth/session");
    const { getApiClient } = await import("#/server/api/haxfootball");
    await requireAnyApiPermission(["championship:admin", "championship:operate"]);
    const result = await getApiClient()!.request({
      path: `/visualizations/championships/${encodeURIComponent(data.championshipId)}/configuration`,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.data as never;
  });

export const upsertChampionshipVisualizationFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      championshipId: z.string().uuid(),
      uuid: z.string().uuid().optional(),
      templateVersionId: z.number().int().positive(),
      surface: z.enum(["overview", "statistics"]),
      displayOrder: z.number().int().min(0),
      width: z.enum(["compact", "half", "full"]),
      height: z.enum(["short", "medium", "tall", "viewport"]),
      visibility: z.enum(["draft", "published"]),
      expectedRevision: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireAnyApiPermission } = await import("#/server/auth/session");
    const { getApiClient } = await import("#/server/api/haxfootball");
    const session = await requireAnyApiPermission(["championship:admin", "championship:operate"]);
    const { championshipId, ...body } = data;
    const result = await getApiClient()!.request({
      method: "PUT",
      path: `/visualizations/championships/${encodeURIComponent(championshipId)}/instances`,
      body: { ...body, actorAccountUuid: session.account.uuid },
    });
    return result.ok
      ? { ok: true as const }
      : { ok: false as const, message: result.error.message };
  });
