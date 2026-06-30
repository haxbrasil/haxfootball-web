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
  type MatchEvent,
  type MatchMetrics,
  type MatchSummary,
  type Player,
  type QueryMatchMetricsInput,
  type QueryMatchMetricsResponse,
  type Role,
  type Room,
  type EventSchema,
  type UpdateRoleInput,
} from "@haxbrasil/haxfootball-api-sdk";
import type { PageInfo, PaginationQuery } from "#/lib/pagination/page";
import { groupMetricsByCategory } from "#/lib/stats-metrics/categories";
import { createAccountMatchPage } from "#/server/api/utils/create-account-match-page";
import { cachedJson, deleteCachedJson } from "#/server/cache";
import { getServerEnv } from "#/server/env";

export type { ListMatchesResponse, ListRoomsResponse, MatchSummary };

export type AccountLinkedSessionEntry = ListPlayersResponse["items"][number];
export type ListAccountLinkedSessionEntriesResponse = ListPlayersResponse;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type Page<T> = {
  items: T[];
  page: {
    limit: number;
    nextCursor: string | null;
  };
};

type RoomProgramVersionAlias = components["schemas"]["RoomProgramVersionAlias"];
type HaxFootballClient = NonNullable<ReturnType<typeof getApiClient>>;

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

export type WebMatchEvent = Omit<MatchEvent, "value"> & {
  value: JsonValue;
};

export type WebMatch = Omit<Match, "events"> & {
  events: WebMatchEvent[];
};

export type MatchDetail = {
  match: WebMatch | null;
  metrics: WebMatchMetrics | null;
  metricMetadata: WebQueryMatchMetricsResponse["meta"]["availableMetrics"];
  featuredMetrics: WebQueryMatchMetricsResponse["meta"]["featuredMetrics"];
};

export type WebEventSchema = Omit<EventSchema, "definition"> & {
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
  eventSchemas: Page<WebEventSchema>;
};

export type AdminAccountResources = {
  accounts: ListAccountsResponse;
  roles: ListRolesResponse;
};

export type AdminRoleResources = {
  roles: ListRolesResponse;
  permissions: ListPermissionsResponse;
};

export type AdminOverviewResources = {
  accounts?: ListAccountsResponse;
  roles?: ListRolesResponse;
  rooms?: ListRoomsResponse;
};

export type AdminRoomManagementResources = {
  rooms: ListRoomsResponse;
  roomHistory: ListRoomsResponse;
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

export async function getAdminRoom(id: string): Promise<Room | null> {
  const client = getApiClient();

  return client ? await unwrap(client.rooms.get(id)) : null;
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

export async function getMatch(id: string): Promise<WebMatch | null> {
  const client = getApiClient();

  return client
    ? cachedJson(`public:matches:${id}`, 30, async () =>
        normalizeMatch(await unwrap(client.matches.get(id))),
      )
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

export async function listMatchEvents(
  id: string,
  query: PaginationQuery = {},
): Promise<Page<WebMatchEvent>> {
  const client = getApiClient();

  return client
    ? cachedJson(`public:matches:${id}:events:${JSON.stringify(query)}`, 30, async () => {
        const response = await unwrap(client.matches.listEvents(id, query));

        return response
          ? {
              ...response,
              items: response.items.map((event) => ({
                ...event,
                value: normalizeJsonValue(event.value),
              })),
            }
          : emptyPage<WebMatchEvent>();
      })
    : emptyPage<WebMatchEvent>();
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
    schema: { name: env.EVENT_SCHEMA_NAME },
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
  const env = getServerEnv();

  if (!client) {
    return {
      accounts: emptyPage<Account>(),
      roles: emptyPage(),
      permissions: emptyPage(),
      roomPrograms: emptyPage(),
      proxyEndpoints: emptyPage(),
      eventSchemas: emptyPage(),
    };
  }

  const [accounts, roles, permissions, roomPrograms, proxyEndpoints, eventSchemas] =
    await Promise.all([
      unwrap(client.accounts.list()),
      unwrap(client.roles.list()),
      unwrap(client.permissions.list()),
      unwrap(client.rooms.programs.list({ language: env.LANGUAGE } as PaginationQuery)),
      unwrap(client.rooms.proxyEndpoints.list()),
      unwrap(client.eventSchemas.list()) as Promise<Page<WebEventSchema> | null>,
    ]);

  return {
    accounts: accounts ?? emptyPage<Account>(),
    roles: roles ?? emptyPage(),
    permissions: permissions ?? emptyPage(),
    roomPrograms: roomPrograms ?? emptyPage(),
    proxyEndpoints: proxyEndpoints ?? emptyPage(),
    eventSchemas: eventSchemas ?? emptyPage<WebEventSchema>(),
  };
}

export async function listAdminAccountResources(): Promise<AdminAccountResources> {
  const client = getApiClient();

  if (!client) {
    return {
      accounts: emptyPage<Account>(),
      roles: emptyPage(),
    };
  }

  const [accounts, roles] = await Promise.all([
    unwrap(client.accounts.list()),
    unwrap(client.roles.list()),
  ]);

  return {
    accounts: accounts ?? emptyPage<Account>(),
    roles: roles ?? emptyPage(),
  };
}

export async function listAdminRoleResources(): Promise<AdminRoleResources> {
  const client = getApiClient();

  if (!client) {
    return {
      roles: emptyPage(),
      permissions: emptyPage(),
    };
  }

  const [roles, permissions] = await Promise.all([
    unwrap(client.roles.list()),
    unwrap(client.permissions.list()),
  ]);

  return {
    roles: roles ?? emptyPage(),
    permissions: permissions ?? emptyPage(),
  };
}

export async function listAdminOverviewResources(input: {
  accounts: boolean;
  roles: boolean;
  rooms: boolean;
}): Promise<AdminOverviewResources> {
  const client = getApiClient();

  if (!client) {
    return {
      accounts: input.accounts ? emptyPage<Account>() : undefined,
      roles: input.roles ? emptyPage() : undefined,
      rooms: input.rooms ? emptyPage<Room>() : undefined,
    };
  }

  const [accounts, roles, rooms] = await Promise.all([
    input.accounts ? unwrap(client.accounts.list({ limit: 100 })) : Promise.resolve(null),
    input.roles ? unwrap(client.roles.list({ limit: 100 })) : Promise.resolve(null),
    input.rooms ? unwrap(client.rooms.list({ state: "open", limit: 100 })) : Promise.resolve(null),
  ]);

  return {
    accounts: input.accounts ? (accounts ?? emptyPage<Account>()) : undefined,
    roles: input.roles ? (roles ?? emptyPage()) : undefined,
    rooms: input.rooms ? (rooms ?? emptyPage<Room>()) : undefined,
  };
}

export async function listAdminRoomManagementResources(): Promise<AdminRoomManagementResources> {
  const client = getApiClient();
  const env = getServerEnv();

  if (!client) {
    return {
      rooms: emptyPage<Room>(),
      roomHistory: emptyPage<Room>(),
      roomPrograms: emptyPage(),
      proxyEndpoints: emptyPage(),
      versionsByProgramId: {},
      aliasesByProgramId: {},
    };
  }

  const [rooms, roomHistory, roomPrograms, proxyEndpoints] = await Promise.all([
    unwrap(client.rooms.list({ state: "open" })),
    unwrap(client.rooms.list({ state: "all" })),
    unwrap(client.rooms.programs.list({ language: env.LANGUAGE } as PaginationQuery)),
    unwrap(client.rooms.proxyEndpoints.list()),
  ]);

  const programs = roomPrograms ?? emptyPage();
  const programEntries = await Promise.all(
    programs.items.map(async (program) => {
      const [versions, aliases] = await Promise.all([
        listAllRoomProgramVersions(client, program.id),
        listAllRoomProgramVersionAliases(client, program.id),
      ]);

      return [program.id, versions, aliases] as const;
    }),
  );

  return {
    rooms: rooms ?? emptyPage<Room>(),
    roomHistory: roomHistory ?? emptyPage<Room>(),
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

export async function listAdminRoomHistory(
  query: PaginationQuery = {},
): Promise<ListRoomsResponse> {
  const client = getApiClient();

  if (!client) {
    return emptyPage<Room>();
  }

  return (await unwrap(client.rooms.list({ ...query, state: "all" }))) ?? emptyPage<Room>();
}

async function listAllRoomProgramVersions(
  client: HaxFootballClient,
  programId: string,
): Promise<ListRoomProgramVersionsResponse> {
  const items: ListRoomProgramVersionsResponse["items"] = [];
  const limit = 100;
  let cursor: string | undefined;

  do {
    const page = await unwrap(client.rooms.programs.listVersions(programId, { cursor, limit }));

    if (!page) {
      return emptyPage();
    }

    items.push(...page.items);
    cursor = page.page.nextCursor ?? undefined;
  } while (cursor);

  return {
    items,
    page: {
      limit,
      nextCursor: null,
    },
  };
}

async function listAllRoomProgramVersionAliases(
  client: HaxFootballClient,
  programId: string,
): Promise<Page<RoomProgramVersionAlias>> {
  const items: RoomProgramVersionAlias[] = [];
  const limit = 100;
  let cursor: string | undefined;

  do {
    const page = await unwrap(
      client.request<Page<RoomProgramVersionAlias>>({
        path: `/room-programs/${encodeURIComponent(programId)}/version-aliases`,
        query: { cursor, limit },
      }),
    );

    if (!page) {
      return emptyPage<RoomProgramVersionAlias>();
    }

    items.push(...page.items);
    cursor = page.page.nextCursor ?? undefined;
  } while (cursor);

  return {
    items,
    page: {
      limit,
      nextCursor: null,
    },
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

export async function disableMatchEvent(input: {
  matchId: string;
  eventId: string;
}): Promise<boolean> {
  const client = getApiClient();

  if (!client) {
    return false;
  }

  const event = await unwrap(client.matches.disableEvent(input.matchId, input.eventId));

  if (event) {
    await Promise.all([
      deleteCachedJson(`public:matches:${input.matchId}:events`),
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

function normalizeMatch(match: Match | null): WebMatch | null {
  return match
    ? {
        ...match,
        events: match.events.map((event) => ({
          ...event,
          value: normalizeJsonValue(event.value),
        })),
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
