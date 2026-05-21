import "@tanstack/react-start/server-only";

import {
  createHaxFootballApiClient,
  type Account,
  type components,
  type ConfirmAccountResponse,
  type CreateRoleInput,
  type CreateRoomInput,
  type ListAccountsResponse,
  type ListMatchesResponse,
  type ListPermissionsResponse,
  type ListPlayerMatchesResponse,
  type ListPlayersResponse,
  type ListRolesResponse,
  type ListRoomProgramsResponse,
  type ListRoomProxyEndpointsResponse,
  type ListRoomProgramVersionsResponse,
  type ListRoomsResponse,
  type Match,
  type MatchMetrics,
  type MatchStatEvent,
  type Player,
  type QueryMatchMetricsInput,
  type QueryMatchMetricsResponse,
  type Role,
  type Room,
  type StatEventSchema,
  type UpdateRoleInput,
} from "@haxbrasil/haxfootball-api-sdk";
import { cachedJson, deleteCachedJson } from "#/server/cache";
import { getServerEnv } from "#/server/env";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };

type Page<T> = {
  items: T[];
  page: {
    limit: number;
    nextCursor: string | null;
  };
};

type RoomProgramVersionAlias = components["schemas"]["RoomProgramVersionAlias"];

export type WebQueryMatchMetricsResponse = Omit<QueryMatchMetricsResponse, "items" | "meta"> & {
  items: Array<
    Omit<QueryMatchMetricsResponse["items"][number], "metrics"> & {
      metrics: Record<string, JsonValue>;
    }
  >;
  meta: Omit<QueryMatchMetricsResponse["meta"], "sort"> & {
    sort: JsonValue[];
  };
};

export type PlayerDetail = {
  player: Player | null;
  matches: ListPlayerMatchesResponse;
  stats: WebQueryMatchMetricsResponse | null;
};

export type WebMatchMetrics = Array<
  Omit<MatchMetrics[number], "metrics"> & {
    metrics: Record<string, JsonValue>;
  }
>;

export type WebMatchStatEvent = Omit<MatchStatEvent, "value"> & {
  value: JsonValue;
};

export type MatchDetail = {
  match: Match | null;
  metrics: WebMatchMetrics | null;
  statEvents: Page<WebMatchStatEvent>;
  canModerateStats: boolean;
};

export type WebStatEventSchema = Omit<StatEventSchema, "definition"> & {
  definition: JsonValue;
};

export type StatsQuery = {
  accountIds?: string[];
  groupBy?: NonNullable<QueryMatchMetricsInput["group"]>["by"];
  sortKey?: string;
  sortType?: "field" | "metric";
  direction?: "asc" | "desc";
  limit?: number;
  metrics?: string[];
  eventTypes?: string[];
  playerIds?: string[];
  status?: "all" | "completed" | "ongoing";
};

export type AdminResources = {
  accounts: ListAccountsResponse;
  roles: ListRolesResponse;
  permissions: ListPermissionsResponse;
  roomPrograms: ListRoomProgramsResponse;
  proxyEndpoints: ListRoomProxyEndpointsResponse;
  jobs: Page<JsonObject>;
  statSchemas: Page<WebStatEventSchema>;
};

export type AdminRoomManagementResources = {
  rooms: ListRoomsResponse;
  roomPrograms: ListRoomProgramsResponse;
  proxyEndpoints: ListRoomProxyEndpointsResponse;
  versionsByProgramId: Record<string, ListRoomProgramVersionsResponse>;
  aliasesByProgramId: Record<string, Page<RoomProgramVersionAlias>>;
};

const emptyPage = <T>(): Page<T> => ({
  items: [],
  page: {
    limit: 50,
    nextCursor: null,
  },
});

export function getApiClient() {
  const env = getServerEnv();

  if (!env.API_BASE_URL || !env.API_KEY) {
    return null;
  }

  return createHaxFootballApiClient({
    apiUrl: env.API_BASE_URL,
    apiKey: env.API_KEY,
  });
}

export async function unwrap<T>(
  request: Promise<{ ok: true; data: T } | { ok: false }>,
): Promise<T | null> {
  const result = await request;

  return result.ok ? result.data : null;
}

export async function listRooms(): Promise<ListRoomsResponse> {
  const client = getApiClient();

  if (!client) {
    return emptyPage<Room>();
  }

  return cachedJson(
    "public:rooms:all",
    15,
    async () => (await unwrap(client.rooms.list({ state: "all" }))) ?? emptyPage<Room>(),
  );
}

export async function getRoom(id: string): Promise<Room | null> {
  const client = getApiClient();

  return client ? cachedJson(`public:rooms:${id}`, 15, () => unwrap(client.rooms.get(id))) : null;
}

export async function listMatches(): Promise<ListMatchesResponse> {
  const client = getApiClient();

  return client
    ? cachedJson(
        "public:matches",
        30,
        async () => (await unwrap(client.matches.list())) ?? emptyPage(),
      )
    : emptyPage();
}

export async function getMatch(id: string): Promise<Match | null> {
  const client = getApiClient();

  return client
    ? cachedJson(`public:matches:${id}`, 30, () => unwrap(client.matches.get(id)))
    : null;
}

export async function getMatchMetrics(id: string): Promise<WebMatchMetrics | null> {
  const client = getApiClient();

  return client
    ? cachedJson(`public:matches:${id}:metrics`, 30, async () => {
        const metrics = await unwrap(client.matches.getMetrics(id));

        return (
          metrics?.map((row) => ({
            ...row,
            metrics: normalizeJsonRecord(row.metrics),
          })) ?? null
        );
      })
    : null;
}

export async function listMatchStatEvents(id: string): Promise<Page<WebMatchStatEvent>> {
  const client = getApiClient();

  return client
    ? cachedJson(`public:matches:${id}:stat-events`, 30, async () => {
        const response = await unwrap(client.matches.listStatEvents(id));

        return response
          ? {
              ...response,
              items: response.items.map((event) => ({
                ...event,
                value: normalizeJsonValue(event.value),
              })),
            }
          : emptyPage<WebMatchStatEvent>();
      })
    : emptyPage<WebMatchStatEvent>();
}

export async function listPlayers(): Promise<ListPlayersResponse> {
  const client = getApiClient();

  return client
    ? cachedJson(
        "public:players",
        60,
        async () => (await unwrap(client.players.list())) ?? emptyPage(),
      )
    : emptyPage();
}

export async function getPlayer(externalId: string): Promise<PlayerDetail> {
  const client = getApiClient();

  if (!client) {
    return {
      player: null,
      matches: emptyPage(),
      stats: null,
    };
  }

  return cachedJson(`public:players:${externalId}`, 60, async () => {
    const [player, matches, stats] = await Promise.all([
      unwrap(client.players.get(externalId)),
      unwrap(client.players.listMatches(externalId)),
      getStats({
        groupBy: "player",
        playerIds: [externalId],
        limit: 1,
        sortKey: "name",
        sortType: "field",
      }),
    ]);

    return {
      player,
      matches: matches ?? emptyPage(),
      stats,
    };
  });
}

export async function getStats(
  query: StatsQuery = {},
): Promise<WebQueryMatchMetricsResponse | null> {
  const client = getApiClient();
  const env = getServerEnv();
  const groupBy = query.groupBy ?? "player";
  const sortKey = query.sortKey ?? "name";
  const sortType = query.sortType ?? (sortKey === "name" ? "field" : "metric");
  const direction = query.direction ?? "asc";
  const limit = query.limit ?? 25;
  const body: QueryMatchMetricsInput = {
    schema: { name: env.STAT_SCHEMA_NAME },
    group: { by: groupBy },
    language: env.LANGUAGE,
    page: { limit },
    sort:
      sortType === "field"
        ? [{ type: "field", key: "name", direction }]
        : [{ type: "metric", key: sortKey, direction }],
  };

  if (query.metrics?.length) {
    body.metrics = query.metrics;
  }

  const filters: NonNullable<QueryMatchMetricsInput["filters"]> = {};

  if (query.eventTypes?.length) {
    filters.eventTypes = query.eventTypes;
  }

  if (query.accountIds?.length) {
    filters.accountIds = query.accountIds;
  }

  if (query.playerIds?.length) {
    filters.playerIds = query.playerIds;
  }

  if (query.status && query.status !== "all") {
    filters.statuses = [query.status];
  }

  if (Object.keys(filters).length > 0) {
    body.filters = filters;
  }

  return client
    ? cachedJson(
        `public:stats:${JSON.stringify({ ...query, groupBy, sortKey, sortType, direction, limit })}`,
        30,
        () =>
          unwrap(client.matches.queryMetrics(body)) as Promise<WebQueryMatchMetricsResponse | null>,
      )
    : null;
}

export async function listAdminResources(): Promise<AdminResources> {
  const client = getApiClient();

  if (!client) {
    return {
      accounts: emptyPage<Account>(),
      roles: emptyPage(),
      permissions: emptyPage(),
      roomPrograms: emptyPage(),
      proxyEndpoints: emptyPage(),
      jobs: emptyPage(),
      statSchemas: emptyPage(),
    };
  }

  const [accounts, roles, permissions, roomPrograms, proxyEndpoints, jobs, statSchemas] =
    await Promise.all([
      unwrap(client.accounts.list()),
      unwrap(client.roles.list()),
      unwrap(client.permissions.list()),
      unwrap(client.rooms.programs.list()),
      unwrap(client.rooms.proxyEndpoints.list()),
      unwrap(client.request<Page<JsonObject>>({ path: "/jobs" })),
      unwrap(client.statEventSchemas.list()) as Promise<Page<WebStatEventSchema> | null>,
    ]);

  return {
    accounts: accounts ?? emptyPage<Account>(),
    roles: roles ?? emptyPage(),
    permissions: permissions ?? emptyPage(),
    roomPrograms: roomPrograms ?? emptyPage(),
    proxyEndpoints: proxyEndpoints ?? emptyPage(),
    jobs: jobs ?? emptyPage(),
    statSchemas: statSchemas ?? emptyPage<WebStatEventSchema>(),
  };
}

export async function listAdminRoomManagementResources(): Promise<AdminRoomManagementResources> {
  const client = getApiClient();

  if (!client) {
    return {
      rooms: emptyPage<Room>(),
      roomPrograms: emptyPage(),
      proxyEndpoints: emptyPage(),
      versionsByProgramId: {},
      aliasesByProgramId: {},
    };
  }

  const [rooms, roomPrograms, proxyEndpoints] = await Promise.all([
    unwrap(client.rooms.list({ state: "all" })),
    unwrap(client.rooms.programs.list()),
    unwrap(client.rooms.proxyEndpoints.list()),
  ]);

  const programs = roomPrograms ?? emptyPage();
  const programEntries = await Promise.all(
    programs.items.map(async (program) => {
      const [versions, aliases] = await Promise.all([
        unwrap(client.rooms.programs.listVersions(program.id)),
        unwrap(
          client.request<Page<RoomProgramVersionAlias>>({
            path: `/room-programs/${encodeURIComponent(program.id)}/version-aliases`,
          }),
        ),
      ]);

      return [
        program.id,
        versions ?? emptyPage(),
        aliases ?? emptyPage<RoomProgramVersionAlias>(),
      ] as const;
    }),
  );

  return {
    rooms: rooms ?? emptyPage<Room>(),
    roomPrograms: programs,
    proxyEndpoints: proxyEndpoints ?? emptyPage(),
    versionsByProgramId: Object.fromEntries(
      programEntries.map(([programId, versions]) => [programId, versions]),
    ),
    aliasesByProgramId: Object.fromEntries(
      programEntries.map(([programId, _versions, aliases]) => [programId, aliases]),
    ),
  };
}

export async function launchRoom(input: CreateRoomInput): Promise<Room | null> {
  const client = getApiClient();

  if (!client) {
    return null;
  }

  const room = await unwrap(client.rooms.create(input));

  if (room) {
    await deleteCachedJson("public:rooms:all");
  }

  return room;
}

export async function closeRoom(id: string): Promise<Room | null> {
  const client = getApiClient();

  if (!client) {
    return null;
  }

  const room = await unwrap(client.rooms.close(id));

  await Promise.all([deleteCachedJson("public:rooms:all"), deleteCachedJson(`public:rooms:${id}`)]);

  return room;
}

export async function disableMatchStatEvent(input: {
  matchId: string;
  eventId: string;
}): Promise<boolean> {
  const client = getApiClient();

  if (!client) {
    return false;
  }

  const event = await unwrap(client.matches.disableStatEvent(input.matchId, input.eventId));

  if (event) {
    await Promise.all([
      deleteCachedJson(`public:matches:${input.matchId}:stat-events`),
      deleteCachedJson(`public:matches:${input.matchId}:metrics`),
      deleteCachedJson(`public:players:${event.player.id}`),
      deleteCachedJson("public:stats:player:top"),
    ]);
  }

  return event !== null;
}

export async function updateAccountRole(input: {
  accountUuid: string;
  roleUuid: string;
}): Promise<Account | null> {
  const client = getApiClient();

  return client
    ? unwrap(client.accounts.update(input.accountUuid, { roleUuid: input.roleUuid }))
    : null;
}

export async function createRole(input: CreateRoleInput): Promise<Role | null> {
  const client = getApiClient();

  return client ? unwrap(client.roles.create(input)) : null;
}

export async function updateRole(input: {
  uuid: string;
  body: UpdateRoleInput;
}): Promise<Role | null> {
  const client = getApiClient();

  return client ? unwrap(client.roles.update(input.uuid, input.body)) : null;
}

export async function confirmAccountCredentials(input: {
  name: string;
  password: string;
}): Promise<ConfirmAccountResponse | null> {
  const client = getApiClient();

  return client ? unwrap(client.accounts.confirm(input)) : null;
}

export async function getAccountByName(name: string): Promise<Account | null> {
  const client = getApiClient();

  return client ? unwrap(client.accounts.getByName(name)) : null;
}

export async function getAccountByExternalId(externalId: string): Promise<Account | null> {
  const client = getApiClient();

  return client ? unwrap(client.accounts.getByExternalId(externalId)) : null;
}

export async function getAccountByUuid(uuid: string): Promise<Account | null> {
  const client = getApiClient();

  return client ? unwrap(client.accounts.get(uuid)) : null;
}

function normalizeJsonRecord(value: Record<string, unknown>): Record<string, JsonValue> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, normalizeJsonValue(entry)]),
  );
}

function normalizeJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeJsonValue(entry));
  }

  if (typeof value === "object") {
    return normalizeJsonRecord(value as Record<string, unknown>);
  }

  return null;
}
