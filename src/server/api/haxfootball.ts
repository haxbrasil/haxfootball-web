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
  type ListPlayersQuery,
  type ListPlayersResponse,
  type ListRolesResponse,
  type ListRoomProgramsResponse,
  type ListRoomProxyEndpointsResponse,
  type ListRoomProgramVersionsResponse,
  type ListRoomsQuery,
  type ListRoomsResponse,
  type Match,
  type MatchMetrics,
  type MatchSummary,
  type MatchStatEvent,
  type Player,
  type QueryMatchMetricsInput,
  type QueryMatchMetricsResponse,
  type Role,
  type Room,
  type StatEventSchema,
  type UpdateRoleInput,
} from "@haxbrasil/haxfootball-api-sdk";
import type { PageInfo, PaginationQuery } from "#/lib/pagination/page";
import { groupMetricsByCategory } from "#/lib/stats-metrics/categories";
import { createAccountMatchPage } from "#/server/api/utils/create-account-match-page";
import { cachedJson, deleteCachedJson } from "#/server/cache";
import { getServerEnv } from "#/server/env";

export type { ListMatchesResponse, MatchSummary };

export type AccountLinkedSessionEntry = ListPlayersResponse["items"][number];
export type ListAccountLinkedSessionEntriesResponse = ListPlayersResponse;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };

export type Page<T> = {
  items: T[];
  page: {
    limit: number;
    nextCursor: string | null;
  };
};

type RoomProgramVersionAlias = components["schemas"]["RoomProgramVersionAlias"];

export type WebQueryMatchMetricsResponse = Omit<
  QueryMatchMetricsResponse,
  "items" | "meta" | "page"
> & {
  items: Array<
    Omit<QueryMatchMetricsResponse["items"][number], "metrics"> & {
      metrics: Record<string, JsonValue>;
    }
  >;
  meta: Omit<QueryMatchMetricsResponse["meta"], "sort"> & {
    sort: JsonValue[];
  };
  page: PageInfo;
};

export type PublicAccount = Pick<Account, "uuid" | "name" | "createdAt" | "updatedAt">;

export type ListPublicAccountsResponse = Page<PublicAccount>;

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
  metricMetadata: WebQueryMatchMetricsResponse["meta"]["availableMetrics"];
  featuredMetrics: WebQueryMatchMetricsResponse["meta"]["featuredMetrics"];
};

export type WebStatEventSchema = Omit<StatEventSchema, "definition"> & {
  definition: JsonValue;
};

export type StatsQuery = {
  accountIds?: string[];
  gameModeNames?: string[];
  groupBy?: NonNullable<QueryMatchMetricsInput["group"]>["by"];
  sortKey?: string;
  sortType?: "field" | "metric";
  direction?: "asc" | "desc";
  limit?: number;
  cursor?: string;
  metrics?: string[];
  eventTypes?: string[];
  playerIds?: string[];
  status?: "all" | "completed" | "ongoing";
};

type GameModeAwareMetricsFilters = NonNullable<QueryMatchMetricsInput["filters"]> & {
  gameModeNames?: string[];
};

export type StatsCategoryRanking = {
  key: string;
  title: string;
  primaryMetricKey: string;
  metricKeys: string[];
  metrics: WebQueryMatchMetricsResponse["meta"]["availableMetrics"];
  stats: WebQueryMatchMetricsResponse;
};

export type StatsCategoryRankingsResponse = {
  categories: StatsCategoryRanking[];
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

export async function listRooms(query: PaginationQuery = {}): Promise<ListRoomsResponse> {
  const client = getApiClient();

  if (!client) {
    return emptyPage<Room>();
  }

  const apiQuery: ListRoomsQuery = {
    ...query,
    state: "open",
  };

  return cachedJson(
    `public:rooms:${JSON.stringify(apiQuery)}`,
    15,
    async () => (await unwrap(client.rooms.list(apiQuery))) ?? emptyPage<Room>(),
  );
}

export async function getRoom(id: string): Promise<Room | null> {
  const client = getApiClient();

  return client
    ? cachedJson(`public:rooms:${id}:open-only`, 15, async () => {
        const room = await unwrap(client.rooms.get(id));

        return room && room.state !== "closed" && room.state !== "failed" ? room : null;
      })
    : null;
}

export async function listMatches(query: PaginationQuery = {}): Promise<ListMatchesResponse> {
  const client = getApiClient();
  const env = getServerEnv();
  const apiQuery = {
    ...query,
    gameMode: env.GAME_MODE_NAME,
  };

  return client
    ? cachedJson(
        `public:matches:${JSON.stringify(apiQuery)}`,
        30,
        async () => (await unwrap(client.matches.list(apiQuery))) ?? emptyPage(),
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

export async function listMatchStatEvents(
  id: string,
  query: PaginationQuery = {},
): Promise<Page<WebMatchStatEvent>> {
  const client = getApiClient();

  return client
    ? cachedJson(`public:matches:${id}:stat-events:${JSON.stringify(query)}`, 30, async () => {
        const response = await unwrap(client.matches.listStatEvents(id, query));

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

export async function listPublicAccounts(
  query: PaginationQuery & { search?: string } = {},
): Promise<ListPublicAccountsResponse> {
  const client = getApiClient();

  if (!client) {
    return emptyPage();
  }

  return cachedJson(`public:accounts:${JSON.stringify(query)}`, 60, async () => {
    const response = await unwrap(client.accounts.list(query));

    return response
      ? {
          items: response.items.map(toPublicAccount),
          page: response.page,
        }
      : emptyPage();
  });
}

async function listLinkedSessionEntries(
  query: ListPlayersQuery = {},
): Promise<ListPlayersResponse> {
  const client = getApiClient();

  return client
    ? cachedJson(
        `linked-session-entries:${JSON.stringify(query)}`,
        60,
        async () => (await unwrap(client.players.list(query))) ?? emptyPage<Player>(),
      )
    : emptyPage<Player>();
}

export function listAccountLinkedSessionEntries(
  accountUuid: string,
  query: PaginationQuery = {},
): Promise<ListAccountLinkedSessionEntriesResponse> {
  return listLinkedSessionEntries({
    ...query,
    accountUuid,
  });
}

async function listSessionEntryMatches(
  externalId: string,
  query: PaginationQuery = {},
): Promise<ListPlayerMatchesResponse> {
  const client = getApiClient();

  return client
    ? cachedJson(
        `session-entry-matches:${externalId}:${JSON.stringify(query)}`,
        60,
        async () => (await unwrap(client.players.listMatches(externalId, query))) ?? emptyPage(),
      )
    : emptyPage();
}

export async function listAccountLinkedMatches(
  accountUuid: string,
  query: PaginationQuery = {},
): Promise<ListMatchesResponse> {
  const env = getServerEnv();
  const sessionEntries = await listAccountLinkedSessionEntries(accountUuid, { limit: 100 });

  if (sessionEntries.items.length === 0) {
    return createAccountMatchPage([], query);
  }

  const sessionEntryMatchPages = await Promise.all(
    sessionEntries.items.map((entry) => listSessionEntryMatches(entry.id, { limit: 100 })),
  );

  return createAccountMatchPage(
    sessionEntryMatchPages
      .flatMap((page) => page.items)
      .filter((match) => isGameModeMatch(match, env.GAME_MODE_NAME)),
    query,
  );
}

export async function getStats(
  query: StatsQuery = {},
): Promise<WebQueryMatchMetricsResponse | null> {
  const client = getApiClient();
  const env = getServerEnv();
  const gameModeNames = query.gameModeNames ?? [env.GAME_MODE_NAME];
  const groupBy = query.groupBy ?? "player";
  const sortKey = query.sortKey ?? "name";
  const sortType = query.sortType ?? (sortKey === "name" ? "field" : "metric");
  const direction = query.direction ?? "asc";
  const limit = query.limit ?? 25;
  const body: QueryMatchMetricsInput = {
    schema: { name: env.STAT_SCHEMA_NAME },
    group: { by: groupBy },
    language: env.LANGUAGE,
    page: { cursor: query.cursor, limit },
    sort:
      sortType === "field"
        ? [{ type: "field", key: "name", direction }]
        : [{ type: "metric", key: sortKey, direction }],
  };

  if (query.metrics?.length) {
    body.metrics = query.metrics;
  }

  const filters: GameModeAwareMetricsFilters = {};

  if (query.eventTypes?.length) {
    filters.eventTypes = query.eventTypes;
  }

  if (query.accountIds?.length) {
    filters.accountIds = query.accountIds;
  }

  if (gameModeNames.length > 0) {
    filters.gameModeNames = gameModeNames;
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
        `public:stats:${JSON.stringify({
          ...query,
          gameModeNames,
          groupBy,
          sortKey,
          sortType,
          direction,
          limit,
        })}`,
        30,
        async () =>
          normalizeQueryMetricsResponse(
            await unwrap(client.matches.queryMetrics(body as QueryMatchMetricsInput)),
          ),
      )
    : null;
}

export async function getStatsCategoryRankings(
  query: StatsQuery = {},
): Promise<StatsCategoryRankingsResponse> {
  const groupBy = query.groupBy ?? "account";
  const limit = query.limit ?? 10;
  const metadata = await getStats({
    ...query,
    groupBy,
    limit: 1,
    sortKey: "name",
    sortType: "field",
    direction: "asc",
    cursor: undefined,
    metrics: undefined,
  });

  if (!metadata) {
    return { categories: [] };
  }

  const groups = groupMetricsByCategory(
    metadata.meta.availableMetrics.filter((metric) => !metric.hidden),
    { featuredMetricKey: metadata.meta.featuredMetrics?.points },
  ).filter((group) => group.primaryMetricKey);
  const categories = await Promise.all(
    groups.map(async (group) => {
      const primaryMetricKey = group.primaryMetricKey;

      if (!primaryMetricKey) {
        return null;
      }

      const stats = await getStats({
        ...query,
        groupBy,
        limit,
        cursor: undefined,
        direction: "desc",
        metrics: group.metrics.map((metric) => metric.key),
        sortKey: primaryMetricKey,
        sortType: "metric",
      });

      if (!stats) {
        return null;
      }

      return {
        key: group.key,
        title: group.title,
        primaryMetricKey,
        metricKeys: group.metrics.map((metric) => metric.key),
        metrics: group.metrics,
        stats,
      } satisfies StatsCategoryRanking;
    }),
  );

  return {
    categories: categories.filter((category): category is StatsCategoryRanking => !!category),
  };
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

function normalizeQueryMetricsResponse(
  response: QueryMatchMetricsResponse | null,
): WebQueryMatchMetricsResponse | null {
  return response
    ? {
        ...response,
        items: response.items.map((item) => ({
          ...item,
          metrics: normalizeJsonRecord(item.metrics),
        })),
        meta: {
          ...response.meta,
          sort: response.meta.sort.map((entry) => normalizeJsonValue(entry)),
        },
        page: {
          limit: Number(response.page.limit),
          nextCursor: response.page.nextCursor,
        },
      }
    : null;
}

function toPublicAccount(account: Account): PublicAccount {
  return {
    uuid: account.uuid,
    name: account.name,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

function isGameModeMatch(match: MatchSummary, gameModeName: string): boolean {
  const matchGameMode = (match as MatchSummary & { gameMode?: { name?: string } | null }).gameMode;

  return matchGameMode?.name === gameModeName;
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
