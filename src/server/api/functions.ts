import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { emptyPage } from "#/lib/pagination/page";
import { implementedAdminPermissions, visibleAdminSections } from "#/features/admin/admin-sections";
import {
  countMatches,
  archiveClip,
  createClip,
  createRole,
  disableMatchEvent,
  getClip,
  getClipConfiguration,
  getRecording,
  getMatch,
  getMatchMetrics,
  getMatchVisualizations,
  getAccountByUuid,
  getRole,
  getRoom,
  getRoomLive,
  getStats,
  getStatsCategoryRankings,
  listAccountLinkedMatches,
  listAccountLinkedSessionEntries,
  listClips,
  listAdminAccountResources,
  listAdminOverviewResources,
  listAdminRoleResources,
  listMatches,
  listPublicAccounts,
  listRooms,
  updateAccountRole,
  updateClip,
  updateRole,
  upsertLocalizedValues,
} from "#/server/api/haxfootball";
import {
  getCurrentSession,
  requireCurrentSession,
  requireAnyApiPermission,
  requireApiPermission,
} from "#/server/auth/session";
import { canChangeAccountRole } from "#/lib/auth/role-assignment-policy";
import type { AccountLinkedSessionEntry, ListMatchesResponse } from "./haxfootball";

const idInput = z.object({
  id: z.string().min(1),
});

const clipTickInput = z.number().int().min(0).max(2_147_483_647);
const clipListInput = z
  .object({
    cursor: z.string().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    recordingId: z.string().min(1).optional(),
  })
  .optional();
const createClipInput = z.object({
  recordingId: z.string().min(1),
  startTick: clipTickInput,
  endTick: clipTickInput,
  title: z.string().trim().max(120).optional(),
});
const updateClipInput = z.object({
  id: z.string().min(1),
  startTick: clipTickInput.optional(),
  endTick: clipTickInput.optional(),
  title: z.string().trim().max(120).nullable().optional(),
});

const paginationInput = z
  .object({
    cursor: z.string().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .optional();

const publicAccountListInput = z
  .object({
    cursor: z.string().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    search: z.string().min(1).optional(),
  })
  .optional();

const updateAccountRoleInput = z.object({
  accountUuid: z.string().min(1),
  roleUuid: z.string().min(1),
});

const disableMatchEventInput = z.object({
  matchId: z.string().min(1),
  eventId: z.string().min(1),
});

const statsQueryInput = z.object({
  accountIds: z.array(z.string().min(1)).optional(),
  groupBy: z.enum(["account", "player", "account-or-player"]).optional(),
  sortKey: z.string().min(1).optional(),
  sortType: z.enum(["field", "metric"]).optional(),
  direction: z.enum(["asc", "desc"]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().min(1).optional(),
  metrics: z.array(z.string().min(1)).optional(),
  eventTypes: z.array(z.string().min(1)).optional(),
  playerIds: z.array(z.string().min(1)).optional(),
  status: z.enum(["all", "completed", "ongoing"]).optional(),
});

const rolePermissionKeys = z.array(z.string().min(1));
const roleNameInput = z.string().regex(/^[a-z][a-z0-9-]{0,116}$/);
const roleTitleLabelsInput = z.record(
  z.string().regex(/^[a-z][a-z0-9-]{1,15}$/),
  z.string().trim().min(1),
);
const localizedValueKeyInput = z.string().regex(/^[a-z][a-z0-9.-]{0,127}$/);

const createRoleInput = z.object({
  name: roleNameInput,
  title: z.string().min(1),
  titleLabels: roleTitleLabelsInput.optional(),
  permissions: rolePermissionKeys,
});

const updateRoleInput = z.object({
  uuid: z.string().min(1),
  name: z.string().min(1).optional(),
  title: localizedValueKeyInput.optional(),
  titleLabels: roleTitleLabelsInput.optional(),
  permissions: rolePermissionKeys,
});

export const listRoomsFn = createServerFn({ method: "GET" })
  .inputValidator(paginationInput)
  .handler(({ data }) => listRooms(data ?? {}));

export const getRoomFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(({ data }) => getRoom(data.id));

export const getRoomLiveFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(({ data }) => getRoomLive(data.id));

export const listMatchesFn = createServerFn({ method: "GET" })
  .inputValidator(paginationInput)
  .handler(({ data }) => listMatches(data ?? {}));

export const countMatchesFn = createServerFn({ method: "GET" }).handler(() => countMatches());

export const listClipsFn = createServerFn({ method: "GET" })
  .inputValidator(clipListInput)
  .handler(({ data }) => listClips(data ?? {}));

export const getClipFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(({ data }) => getClip(data.id));

export const getRecordingFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(({ data }) => getRecording(data.id));

export const getClipConfigurationFn = createServerFn({ method: "GET" }).handler(() =>
  getClipConfiguration(),
);

export const createClipFn = createServerFn({ method: "POST" })
  .inputValidator(createClipInput)
  .handler(async ({ data }) => {
    await requireCurrentSession();

    return createClip(data);
  });

export const updateClipFn = createServerFn({ method: "POST" })
  .inputValidator(updateClipInput)
  .handler(async ({ data }) => {
    await requireCurrentSession();

    const { id, ...body } = data;

    return updateClip(id, body);
  });

export const archiveClipFn = createServerFn({ method: "POST" })
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    await requireCurrentSession();

    return (await archiveClip(data.id))
      ? ({ ok: true } as const)
      : ({ ok: false, message: "Não foi possível arquivar o clipe." } as const);
  });

export const getMatchFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(({ data }) => getMatch(data.id));

export const getMatchDetailFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const [match, metrics, stats, visualizations] = await Promise.all([
      getMatch(data.id),
      getMatchMetrics(data.id),
      getStats({ limit: 1 }),
      getMatchVisualizations(data.id),
    ]);

    return {
      match,
      metrics,
      metricMetadata: stats?.meta.availableMetrics ?? [],
      featuredMetrics: stats?.meta.featuredMetrics ?? {},
      visualizations,
    };
  });

export const listPublicAccountsFn = createServerFn({ method: "GET" })
  .inputValidator(publicAccountListInput)
  .handler(({ data }) => listPublicAccounts(data ?? {}));

export const getAccountPageDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getCurrentSession();

  if (!session) {
    return {
      session,
      sessionEntries: null,
      matches: null,
    };
  }

  const [sessionEntries, matches] = await Promise.all([
    listAccountLinkedSessionEntries(session.account.uuid, {
      limit: 8,
    }),
    listAccountLinkedMatches(session.account.uuid, { limit: 3 }),
  ]);

  return {
    session,
    sessionEntries,
    matches,
  };
});

export const listAccountLinkedSessionEntriesFn = createServerFn({ method: "GET" })
  .inputValidator(paginationInput)
  .handler(async ({ data }) => {
    const session = await getCurrentSession();

    if (!session) {
      return emptyPage<AccountLinkedSessionEntry>(data?.limit);
    }

    return listAccountLinkedSessionEntries(session.account.uuid, {
      cursor: data?.cursor,
      limit: data?.limit,
    });
  });

export const listAccountMatchesFn = createServerFn({ method: "GET" })
  .inputValidator(paginationInput)
  .handler(async ({ data }) => {
    const session = await getCurrentSession();

    if (!session) {
      return emptyPage<ListMatchesResponse["items"][number]>(data?.limit);
    }

    return listAccountLinkedMatches(session.account.uuid, {
      cursor: data?.cursor,
      limit: data?.limit,
    });
  });

export const getStatsFn = createServerFn({ method: "GET" }).handler(() => getStats());

export const getStatsCategoryRankingsFn = createServerFn({ method: "GET" })
  .inputValidator(statsQueryInput.optional())
  .handler(({ data }) => getStatsCategoryRankings(data ?? {}));

export const queryStatsFn = createServerFn({ method: "GET" })
  .inputValidator(statsQueryInput)
  .handler(({ data }) => getStats(data));

export const getAdminOverviewFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requireAnyApiPermission(implementedAdminPermissions);
  const sections = visibleAdminSections(session);
  const resources = await listAdminOverviewResources({
    accounts: sections.some((section) => section.key === "accounts"),
    championships: sections.some((section) => section.key === "championships"),
    matches: sections.some((section) => section.key === "matches"),
    roles: sections.some((section) => section.key === "roles"),
    roomPrograms: sections.some((section) => section.key === "room-programs"),
    rooms: sections.some((section) => section.key === "rooms"),
    eventSchemas: sections.some((section) => section.key === "modes-statistics"),
    honorDefinitions: sections.some((section) => section.key === "honors"),
  });

  return { sections, resources };
});

export const listAdminAccountResourcesFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requireApiPermission("account:admin");
  const resources = await listAdminAccountResources();

  return { ...resources, session };
});

export const listAdminRoleResourcesFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireApiPermission("role:admin");

  return listAdminRoleResources();
});

export const updateAccountRoleFn = createServerFn({ method: "POST" })
  .inputValidator(updateAccountRoleInput)
  .handler(async ({ data }) => {
    const session = await requireApiPermission("account-role:update");
    const [actorAccount, targetAccount, targetRole] = await Promise.all([
      getAccountByUuid(session.account.uuid),
      getAccountByUuid(data.accountUuid),
      getRole(data.roleUuid),
    ]);

    if (!actorAccount) {
      return { ok: false, message: "Sessão inválida." } as const;
    }

    if (!targetAccount) {
      return { ok: false, message: "Conta não encontrada." } as const;
    }

    if (!targetRole) {
      return { ok: false, message: "Cargo não encontrado." } as const;
    }

    if (
      !canChangeAccountRole({
        actor: actorAccount,
        targetAccountUuid: targetAccount.uuid,
        currentRole: targetAccount.role,
        targetRole,
      })
    ) {
      return {
        ok: false,
        message: "Você não pode atribuir esse cargo.",
      } as const;
    }

    const account = await updateAccountRole(data);

    return account
      ? ({ ok: true, account } as const)
      : ({ ok: false, message: "Não foi possível atualizar a conta." } as const);
  });

export const createRoleFn = createServerFn({ method: "POST" })
  .inputValidator(createRoleInput)
  .handler(async ({ data }) => {
    await requireApiPermission("role:admin");

    const roleTitleKey = data.titleLabels ? `role.${data.name}.title` : data.title;

    if (data.titleLabels) {
      const localizedValues = await upsertLocalizedValues({
        values: Object.entries(data.titleLabels).map(([language, label]) => ({
          value: roleTitleKey,
          language,
          label,
        })),
      });

      if (!localizedValues) {
        return { ok: false, message: "Não foi possível salvar os títulos do cargo." } as const;
      }
    }

    const role = await createRole({
      name: data.name,
      title: roleTitleKey,
      permissions: data.permissions,
    });

    return role
      ? ({ ok: true, role } as const)
      : ({ ok: false, message: "Não foi possível criar o cargo." } as const);
  });

export const updateRoleFn = createServerFn({ method: "POST" })
  .inputValidator(updateRoleInput)
  .handler(async ({ data }) => {
    await requireApiPermission("role:admin");

    const role = await updateRole({
      uuid: data.uuid,
      body: {
        name: data.name,
        title: data.title,
        permissions: data.permissions,
      },
      titleLabels: data.titleLabels,
    });

    return role
      ? ({ ok: true, role } as const)
      : ({ ok: false, message: "Não foi possível atualizar o cargo." } as const);
  });

export const disableMatchEventFn = createServerFn({ method: "POST" })
  .inputValidator(disableMatchEventInput)
  .handler(async ({ data }) => {
    await requireApiPermission("stat-event:disable");

    const disabled = await disableMatchEvent(data);

    return disabled
      ? ({ ok: true } as const)
      : ({ ok: false, message: "Não foi possível desabilitar o evento." } as const);
  });
