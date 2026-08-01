import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RenderedVisualization } from "#/features/visualizations/types";

const specification = z.object({
  datasets: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      operations: z.array(z.record(z.string(), z.unknown())).optional(),
    }),
  ),
  option: z.record(z.string(), z.unknown()),
  chart: z
    .object({
      type: z.enum([
        "bar",
        "line",
        "area",
        "scatter",
        "bubble",
        "pie",
        "donut",
        "radar",
        "heatmap",
        "boxplot",
        "funnel",
        "gauge",
        "treemap",
        "sunburst",
        "sankey",
        "graph",
        "tree",
        "parallel",
        "calendar",
      ]),
      datasetId: z.string(),
      fields: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
      settings: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  interactions: z.record(z.string(), z.unknown()).optional(),
  accessibility: z
    .object({ summary: z.string().optional(), table: z.boolean().optional() })
    .optional(),
});
const access = ["game-mode:admin", "event-schema:admin", "visualization:admin"];

export const previewVisualizationFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      specification,
      datasets: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
    }),
  )
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { getApiClient } = await import("#/server/api/haxfootball");
    await requireApiPermission("visualization:admin");
    const result = await getApiClient()!.request<Omit<RenderedVisualization, "id" | "title">>({
      method: "POST",
      path: "/visualizations/preview",
      body: data,
    });
    return result.ok
      ? { ok: true as const, visualization: result.data }
      : { ok: false as const, message: result.error.message };
  });

export const listStatisticsAdminResourcesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const { requireAnyApiPermission } = await import("#/server/auth/session");
    const { getApiClient, unwrap } = await import("#/server/api/haxfootball");
    await requireAnyApiPermission(access);
    const client = getApiClient();
    if (!client)
      return {
        gameModes: { items: [] },
        eventSchemas: { items: [] },
        templates: { items: [], totalCount: 0, truncated: false },
      };
    const [gameModes, eventSchemas, templates] = await Promise.all([
      unwrap(client.gameModes.list({ visibility: "all", limit: 100 })),
      unwrap(client.eventSchemas.list({ limit: 100 })),
      unwrap(
        client.request({ path: "/visualizations/templates", query: { includeArchived: true } }),
      ),
    ]);
    return {
      gameModes: gameModes ?? { items: [] },
      eventSchemas: eventSchemas ?? { items: [] },
      templates: templates ?? { items: [], totalCount: 0, truncated: false },
    } as never;
  },
);

export const createVisualizationTemplateFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      title: z.string().min(1),
      description: z.string().nullable().optional(),
      scope: z.enum(["match", "championship"]),
      specification,
    }),
  )
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { getApiClient } = await import("#/server/api/haxfootball");
    const session = await requireApiPermission("visualization:admin");
    const result = await getApiClient()!.request({
      method: "POST",
      path: "/visualizations/templates",
      body: { ...data, actorAccountUuid: session.account.uuid },
    });
    return result.ok
      ? { ok: true as const, template: result.data as { id: string; draft?: { revision: number } } }
      : { ok: false as const, message: result.error.message };
  });

export const saveVisualizationDraftFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      expectedRevision: z.number().int().min(0),
      name: z.string().min(1),
      title: z.string().min(1),
      scope: z.enum(["match", "championship"]),
      specification,
    }),
  )
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { getApiClient } = await import("#/server/api/haxfootball");
    const session = await requireApiPermission("visualization:admin");
    const result = await getApiClient()!.request({
      method: "PUT",
      path: `/visualizations/templates/${encodeURIComponent(data.id)}/draft`,
      body: {
        specification: data.specification,
        name: data.name,
        title: data.title,
        scope: data.scope,
        expectedRevision: data.expectedRevision,
        actorAccountUuid: session.account.uuid,
      },
    });
    return result.ok
      ? {
          ok: true as const,
          template: result.data as { id: string; draft?: { revision: number } },
        }
      : { ok: false as const, message: result.error.message };
  });

export const publishVisualizationTemplateFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), expectedRevision: z.number().int().min(0) }))
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { getApiClient } = await import("#/server/api/haxfootball");
    const session = await requireApiPermission("visualization:admin");
    const result = await getApiClient()!.request({
      method: "POST",
      path: `/visualizations/templates/${encodeURIComponent(data.id)}/publish`,
      body: { expectedRevision: data.expectedRevision, actorAccountUuid: session.account.uuid },
    });
    return result.ok
      ? {
          ok: true as const,
          published: Boolean((result.data as { published?: boolean }).published),
        }
      : { ok: false as const, message: result.error.message };
  });

export const cloneEventSchemaFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ id: z.string().uuid(), name: z.string().min(1), title: z.string().optional() }),
  )
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { getApiClient } = await import("#/server/api/haxfootball");
    await requireApiPermission("event-schema:admin");
    const result = await getApiClient()!.request({
      method: "POST",
      path: `/event-schemas/${encodeURIComponent(data.id)}/clone`,
      body: { name: data.name, title: data.title },
    });
    return result.ok
      ? { ok: true as const }
      : { ok: false as const, message: result.error.message };
  });

export const createGameModeFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      title: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      visibility: z.enum(["visible", "hidden"]),
      rank: z.number().int(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { getApiClient } = await import("#/server/api/haxfootball");
    await requireApiPermission("game-mode:admin");
    const result = await getApiClient()!.gameModes.create(data as never);
    return result.ok
      ? { ok: true as const }
      : { ok: false as const, message: result.error.message };
  });

export const createEventSchemaFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      title: z.string().optional(),
      description: z.string().optional(),
      definition: z.unknown(),
    }),
  )
  .handler(async ({ data }) => {
    const { requireApiPermission } = await import("#/server/auth/session");
    const { getApiClient } = await import("#/server/api/haxfootball");
    await requireApiPermission("event-schema:admin");
    const result = await getApiClient()!.eventSchemas.create({
      ...data,
      managementMode: "manual",
    } as never);
    return result.ok
      ? { ok: true as const }
      : { ok: false as const, message: result.error.message };
  });
