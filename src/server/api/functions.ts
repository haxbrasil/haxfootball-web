import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  closeRoom,
  createRole,
  disableMatchStatEvent,
  getMatch,
  getMatchMetrics,
  getPlayer,
  getRoom,
  getStats,
  listMatchStatEvents,
  launchRoom,
  listAdminRoomManagementResources,
  listAdminResources,
  listMatches,
  listPlayers,
  listRooms,
  updateAccountRole,
  updateRole,
} from "#/server/api/haxfootball";
import { getCurrentSession, hasApiPermission, requireApiPermission } from "#/server/auth/session";

const idInput = z.object({
  id: z.string().min(1),
});

const launchConfigValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const launchRoomInput = z.object({
  programId: z.string().min(1),
  version: z.string().min(1),
  haxballToken: z.string().min(1),
  launchConfig: z.record(z.string(), launchConfigValue).optional(),
});

const updateAccountRoleInput = z.object({
  accountUuid: z.string().min(1),
  roleUuid: z.string().min(1),
});

const disableMatchStatEventInput = z.object({
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
  metrics: z.array(z.string().min(1)).optional(),
  eventTypes: z.array(z.string().min(1)).optional(),
  playerIds: z.array(z.string().min(1)).optional(),
  status: z.enum(["all", "completed", "ongoing"]).optional(),
});

const rolePermissionKeys = z.array(z.string().min(1));

const createRoleInput = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  permissions: rolePermissionKeys,
});

const updateRoleInput = z.object({
  uuid: z.string().min(1),
  name: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  permissions: rolePermissionKeys,
});

export const listRoomsFn = createServerFn({ method: "GET" }).handler(() => listRooms());

export const getRoomFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(({ data }) => getRoom(data.id));

export const listMatchesFn = createServerFn({ method: "GET" }).handler(() => listMatches());

export const getMatchFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(({ data }) => getMatch(data.id));

export const getMatchDetailFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    const [match, metrics, statEvents, session] = await Promise.all([
      getMatch(data.id),
      getMatchMetrics(data.id),
      listMatchStatEvents(data.id),
      getCurrentSession(),
    ]);

    return {
      match,
      metrics,
      statEvents,
      canModerateStats: session ? hasApiPermission(session, "room:admin") : false,
    };
  });

export const listPlayersFn = createServerFn({ method: "GET" }).handler(() => listPlayers());

export const getPlayerFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(({ data }) => getPlayer(data.id));

export const getStatsFn = createServerFn({ method: "GET" }).handler(() => getStats());

export const queryStatsFn = createServerFn({ method: "GET" })
  .inputValidator(statsQueryInput)
  .handler(({ data }) => getStats(data));

export const listAdminResourcesFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireApiPermission("room:admin");

  return listAdminResources();
});

export const listAdminRoomManagementResourcesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireApiPermission("room:admin");

    return listAdminRoomManagementResources();
  },
);

export const launchRoomFn = createServerFn({ method: "POST" })
  .inputValidator(launchRoomInput)
  .handler(async ({ data }) => {
    await requireApiPermission("room:admin");

    const room = await launchRoom(data);

    return room
      ? ({ ok: true, room } as const)
      : ({ ok: false, message: "Não foi possível lançar a sala." } as const);
  });

export const closeRoomFn = createServerFn({ method: "POST" })
  .inputValidator(idInput)
  .handler(async ({ data }) => {
    await requireApiPermission("room:admin");

    const room = await closeRoom(data.id);

    return room
      ? ({ ok: true, room } as const)
      : ({ ok: false, message: "Não foi possível fechar a sala." } as const);
  });

export const updateAccountRoleFn = createServerFn({ method: "POST" })
  .inputValidator(updateAccountRoleInput)
  .handler(async ({ data }) => {
    await requireApiPermission("room:admin");

    const account = await updateAccountRole(data);

    return account
      ? ({ ok: true, account } as const)
      : ({ ok: false, message: "Não foi possível atualizar a conta." } as const);
  });

export const createRoleFn = createServerFn({ method: "POST" })
  .inputValidator(createRoleInput)
  .handler(async ({ data }) => {
    await requireApiPermission("room:admin");

    const role = await createRole(data);

    return role
      ? ({ ok: true, role } as const)
      : ({ ok: false, message: "Não foi possível criar o cargo." } as const);
  });

export const updateRoleFn = createServerFn({ method: "POST" })
  .inputValidator(updateRoleInput)
  .handler(async ({ data }) => {
    await requireApiPermission("room:admin");

    const role = await updateRole({
      uuid: data.uuid,
      body: {
        name: data.name,
        title: data.title,
        permissions: data.permissions,
      },
    });

    return role
      ? ({ ok: true, role } as const)
      : ({ ok: false, message: "Não foi possível atualizar o cargo." } as const);
  });

export const disableMatchStatEventFn = createServerFn({ method: "POST" })
  .inputValidator(disableMatchStatEventInput)
  .handler(async ({ data }) => {
    await requireApiPermission("room:admin");

    const disabled = await disableMatchStatEvent(data);

    return disabled
      ? ({ ok: true } as const)
      : ({ ok: false, message: "Não foi possível desabilitar o evento." } as const);
  });
