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
  type RoomProgram,
  type RoomProgramVersion,
  type ListRoomsQuery,
  type ListRoomsResponse,
  type Match,
  type MatchCompositionInput,
  type MatchRound,
  type MatchEvent,
  type MatchMetrics,
  type MatchSummary,
  type PhysicalMatch,
  type ComposedMatch,
  type Player,
  type QueryMatchMetricsInput,
  type QueryMatchMetricsResponse,
  type Role,
  type Room,
  type EventSchema,
  type CreateRoomProgramInput,
  type CreateRoomProgramVersionInput,
  type DiscoverRoomProgramVersionsInput,
  type DiscoverRoomProgramVersionsResponse,
  type UpdateRoomProgramInput,
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
type RoomArtifact = components["schemas"]["RoomArtifact"];
type UpsertRoomProgramVersionAliasInput =
  components["schemas"]["UpsertRoomProgramVersionAliasBody"];
type HaxFootballClient = NonNullable<ReturnType<typeof getApiClient>>;
type RoleListQuery = PaginationQuery & { language?: string };
export type Language = components["schemas"]["ListLanguages"]["items"][number];
export type LocalizedValue = components["schemas"]["Value"];
type BulkUpsertLocalizedValuesInput = components["schemas"]["BulkUpsertValuesBody"];
type RoomProgramLiveStateContract = NonNullable<RoomProgram["liveStateContract"]>;

export type WebRoomProgram = Omit<RoomProgram, "liveStateContract"> & {
  liveStateContract:
    | (Omit<RoomProgramLiveStateContract, "documents"> & {
        documents: Array<
          Omit<RoomProgramLiveStateContract["documents"][number], "schema"> & {
            schema: JsonValue;
          }
        >;
      })
    | null;
};

export type WebListRoomProgramsResponse = Omit<ListRoomProgramsResponse, "items"> & {
  items: WebRoomProgram[];
};

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

type MatchMetricRow = Extract<MatchMetrics, unknown[]>[number];
type ComposedMatchMetrics = Exclude<MatchMetrics, unknown[]>;

export type WebMatchMetricRow = Omit<MatchMetricRow, "metrics"> & {
  metrics: Record<string, JsonValue>;
};

export type WebMatchMetrics =
  | WebMatchMetricRow[]
  | {
      overall: WebMatchMetricRow[];
      rounds: Array<
        Omit<ComposedMatchMetrics["rounds"][number], "metrics"> & {
          metrics: WebMatchMetricRow[];
        }
      >;
    };

export type WebMatchEvent = Omit<MatchEvent, "value"> & {
  value: JsonValue;
};

export type WebPhysicalMatch = Omit<PhysicalMatch, "events"> & {
  events: WebMatchEvent[];
};

export type WebMatchRound = MatchRound extends infer Round
  ? Round extends { match: PhysicalMatch }
    ? Omit<Round, "match"> & { match: WebPhysicalMatch }
    : never
  : never;

export type WebComposedMatch = Omit<ComposedMatch, "rounds"> & {
  rounds: WebMatchRound[];
};

export type WebMatch = WebPhysicalMatch | WebComposedMatch;

export type WebRoundMatchEvent = {
  round: MatchRound extends infer Round
    ? Round extends { match: PhysicalMatch }
      ? Omit<Round, "match">
      : never
    : never;
  event: WebMatchEvent;
};

export type WebMatchEventsPage = Page<WebMatchEvent | WebRoundMatchEvent>;

export type MatchDetail = {
  match: WebMatch | null;
  metrics: WebMatchMetrics | null;
  events: WebMatchEventsPage;
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
  roomPrograms: WebListRoomProgramsResponse;
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
  languages: Page<Language>;
  roleTitleValues: Record<string, LocalizedValue | null>;
};

export type AdminOverviewResources = {
  accounts?: ListAccountsResponse;
  roles?: ListRolesResponse;
  rooms?: ListRoomsResponse;
};

export type AdminRoomManagementResources = {
  rooms: ListRoomsResponse;
  roomHistory: ListRoomsResponse;
  roomPrograms: WebListRoomProgramsResponse;
  proxyEndpoints: ListRoomProxyEndpointsResponse;
  versionsByProgramId: Record<string, ListRoomProgramVersionsResponse>;
  aliasesByProgramId: Record<string, Page<RoomProgramVersionAlias>>;
};

export type AdminRoomProgramResources = {
  roomPrograms: WebListRoomProgramsResponse;
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

export async function listAdminMatches(query: PaginationQuery = {}): Promise<ListMatchesResponse> {
  const client = getApiClient();
  const env = getServerEnv();

  return client
    ? ((await unwrap(
        client.matches.list({
          ...query,
          gameMode: env.GAME_MODE_NAME,
        }),
      )) ?? emptyPage())
    : emptyPage();
}

export async function getMatch(id: string): Promise<WebMatch | null> {
  const client = getApiClient();

  return client
    ? cachedJson(`public:matches:${id}`, 30, async () => {
        const match = await unwrap(client.matches.get(id));

        return normalizeMatch(client, match);
      })
    : null;
}

export async function getMatchMetrics(id: string): Promise<WebMatchMetrics | null> {
  const client = getApiClient();

  return client
    ? cachedJson(`public:matches:${id}:metrics`, 30, async () => {
        const metrics = await unwrap(client.matches.getMetrics(id));

        return normalizeMatchMetrics(metrics);
      })
    : null;
}

export async function listMatchEvents(
  id: string,
  query: PaginationQuery = {},
): Promise<WebMatchEventsPage> {
  const client = getApiClient();

  return client
    ? cachedJson(`public:matches:${id}:events:${JSON.stringify(query)}`, 30, async () => {
        const response = await unwrap(client.matches.listEvents(id, query));

        return response
          ? {
              ...response,
              items: response.items.map(normalizeMatchEventItem),
              page: {
                limit: Number(response.page.limit),
                nextCursor: response.page.nextCursor,
              },
            }
          : emptyPage<WebMatchEvent | WebRoundMatchEvent>();
      })
    : emptyPage<WebMatchEvent | WebRoundMatchEvent>();
}

export async function getMatchCompositionCandidate(id: string): Promise<WebPhysicalMatch | null> {
  const client = getApiClient();
  const match = client ? await unwrap(client.matches.get(id)) : null;

  return match?.kind === "single" ? normalizePhysicalMatch(match) : null;
}

export async function createMatchComposition(
  input: MatchCompositionInput,
): Promise<WebComposedMatch | null> {
  const client = getApiClient();

  if (!client) {
    return null;
  }

  const match = await unwrap(client.matches.createComposition(input));

  await clearMatchCaches([match?.id, ...input.rounds.map((round) => round.matchId)]);

  return match ? hydrateComposedMatch(client, match) : null;
}

export async function updateMatchComposition(
  id: string,
  input: MatchCompositionInput,
): Promise<WebComposedMatch | null> {
  const client = getApiClient();

  if (!client) {
    return null;
  }

  const match = await unwrap(client.matches.updateComposition(id, input));

  await clearMatchCaches([id, ...input.rounds.map((round) => round.matchId)]);

  return match ? hydrateComposedMatch(client, match) : null;
}

export async function deleteMatchComposition(id: string): Promise<boolean> {
  const client = getApiClient();
  const composition = client ? await unwrap(client.matches.get(id)) : null;
  const result = client ? await client.matches.deleteComposition(id) : null;

  if (!result?.ok) {
    return false;
  }

  await clearMatchCaches([
    id,
    ...(composition?.kind === "composed" ? composition.rounds.map((round) => round.matchId) : []),
  ]);

  return true;
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
      unwrap(client.permissions.list({ limit: 100 })),
      unwrap(client.rooms.programs.list({ language: env.LANGUAGE } as PaginationQuery)),
      unwrap(client.rooms.proxyEndpoints.list()),
      unwrap(client.eventSchemas.list()) as Promise<Page<WebEventSchema> | null>,
    ]);

  return {
    accounts: accounts ?? emptyPage<Account>(),
    roles: roles ?? emptyPage(),
    permissions: permissions ?? emptyPage(),
    roomPrograms: normalizeRoomProgramPage(roomPrograms),
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
  const env = getServerEnv();

  if (!client) {
    return {
      roles: emptyPage(),
      permissions: emptyPage(),
      languages: emptyPage<Language>(),
      roleTitleValues: {},
    };
  }

  const [roles, permissions, languages] = await Promise.all([
    listAllRoles(client, env.LANGUAGE),
    listAllPermissions(client),
    listAllLanguages(client),
  ]);
  const roleTitleValues = await listRoleTitleValues(client, roles.items);

  return {
    roles: roles ?? emptyPage(),
    permissions: permissions ?? emptyPage(),
    languages,
    roleTitleValues,
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

  const programs = normalizeRoomProgramPage(roomPrograms);
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

export async function listAdminRoomProgramResources(): Promise<AdminRoomProgramResources> {
  const client = getApiClient();
  const env = getServerEnv();

  if (!client) {
    return {
      roomPrograms: emptyPage(),
      versionsByProgramId: {},
      aliasesByProgramId: {},
    };
  }

  const programs = normalizeRoomProgramPage(
    await unwrap(client.rooms.programs.list({ language: env.LANGUAGE } as PaginationQuery)),
  );
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
    roomPrograms: programs,
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

async function listAllRoles(
  client: HaxFootballClient,
  language?: string,
): Promise<ListRolesResponse> {
  const items: ListRolesResponse["items"] = [];
  const limit = 100;
  let cursor: string | undefined;

  do {
    const page = await unwrap(client.roles.list({ cursor, language, limit } as RoleListQuery));

    if (!page) {
      return emptyPage<Role>();
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

async function listAllLanguages(client: HaxFootballClient): Promise<Page<Language>> {
  const items: Language[] = [];
  const limit = 100;
  let cursor: string | undefined;

  do {
    const page = await unwrap(
      client.request<Page<Language>>({
        path: "/languages",
        query: { cursor, limit },
      }),
    );

    if (!page) {
      return emptyPage<Language>();
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

async function listRoleTitleValues(
  client: HaxFootballClient,
  roles: Role[],
): Promise<Record<string, LocalizedValue | null>> {
  const titleKeys = [...new Set(roles.map((role) => role.title.value))].filter(
    isLocalizationValueKey,
  );
  const entries = await Promise.all(
    titleKeys.map(async (titleKey) => [
      titleKey,
      await unwrap(
        client.request<LocalizedValue>({
          path: `/values/${encodeURIComponent(titleKey)}`,
        }),
      ),
    ]),
  );

  return Object.fromEntries(entries);
}

function isLocalizationValueKey(value: string): boolean {
  return /^[a-z][a-z0-9.-]{0,127}$/.test(value);
}

async function listAllPermissions(client: HaxFootballClient): Promise<ListPermissionsResponse> {
  const items: ListPermissionsResponse["items"] = [];
  const limit = 100;
  let cursor: string | undefined;

  do {
    const page = await unwrap(client.permissions.list({ cursor, limit }));

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

export async function createRoomProgram(
  input: CreateRoomProgramInput,
): Promise<WebRoomProgram | null> {
  const client = getApiClient();
  const program = client ? await unwrap(client.rooms.programs.create(input as never)) : null;

  return program ? normalizeRoomProgram(program) : null;
}

export async function updateRoomProgram(input: {
  id: string;
  body: UpdateRoomProgramInput;
}): Promise<WebRoomProgram | null> {
  const client = getApiClient();
  const program = client
    ? await unwrap(client.rooms.programs.update(input.id, input.body as never))
    : null;

  return program ? normalizeRoomProgram(program) : null;
}

export async function createRoomProgramVersion(input: {
  programId: string;
  body: CreateRoomProgramVersionInput;
}): Promise<RoomProgramVersion | null> {
  const client = getApiClient();

  return client ? unwrap(client.rooms.programs.createVersion(input.programId, input.body)) : null;
}

export async function discoverRoomProgramVersions(input: {
  programId: string;
  body: DiscoverRoomProgramVersionsInput;
}): Promise<DiscoverRoomProgramVersionsResponse | null> {
  const client = getApiClient();

  return client
    ? unwrap(client.rooms.programs.discoverVersions(input.programId, input.body))
    : null;
}

export async function upsertRoomProgramVersionAlias(input: {
  programId: string;
  alias: string;
  body: UpsertRoomProgramVersionAliasInput;
}): Promise<RoomProgramVersionAlias | null> {
  const client = getApiClient();

  return client
    ? unwrap(
        client.request<RoomProgramVersionAlias>({
          method: "PUT" as never,
          path: `/room-programs/${encodeURIComponent(input.programId)}/version-aliases/${encodeURIComponent(input.alias)}`,
          body: input.body,
        }),
      )
    : null;
}

export async function uploadRoomProgramArtifact(input: {
  programId: string;
  branch: string;
  sha: string;
  assetName: string;
  file: File;
}): Promise<RoomArtifact | null> {
  const client = getApiClient();

  if (!client) {
    return null;
  }

  const formData = new FormData();

  formData.set("branch", input.branch);
  formData.set("sha", input.sha);
  formData.set("assetName", input.assetName);
  formData.set("file", input.file, input.assetName);

  return unwrap(
    client.request<RoomArtifact>({
      method: "POST",
      path: `/room-programs/${encodeURIComponent(input.programId)}/artifacts`,
      formData,
    }),
  );
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

export async function getRole(uuid: string): Promise<Role | null> {
  const client = getApiClient();

  return client ? unwrap(client.roles.get(uuid)) : null;
}

export async function createRole(input: CreateRoleInput): Promise<Role | null> {
  const client = getApiClient();

  return client ? unwrap(client.roles.create(input)) : null;
}

export async function upsertLocalizedValues(
  input: BulkUpsertLocalizedValuesInput,
): Promise<LocalizedValue[] | null> {
  const client = getApiClient();

  return client
    ? unwrap(
        client.request<LocalizedValue[]>({
          method: "POST",
          path: "/values/bulk",
          body: input,
        }),
      )
    : null;
}

export async function updateRole(input: {
  uuid: string;
  body: UpdateRoleInput;
  titleLabels?: Record<string, string>;
}): Promise<Role | null> {
  const client = getApiClient();

  if (!client) {
    return null;
  }

  if (input.titleLabels && input.body.title) {
    const localizedValues = await upsertLocalizedValues({
      values: Object.entries(input.titleLabels).map(([language, label]) => ({
        value: input.body.title as string,
        language,
        label,
      })),
    });

    if (!localizedValues) {
      return null;
    }
  }

  return unwrap(client.roles.update(input.uuid, input.body));
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

async function normalizeMatch(
  client: HaxFootballClient,
  match: Match | null,
): Promise<WebMatch | null> {
  if (!match) {
    return null;
  }

  return match.kind === "single"
    ? normalizePhysicalMatch(match)
    : hydrateComposedMatch(client, match);
}

function normalizePhysicalMatch(match: PhysicalMatch): WebPhysicalMatch {
  return {
    ...match,
    events: match.events.map(normalizeMatchEvent),
  };
}

async function hydrateComposedMatch(
  client: HaxFootballClient,
  match: ComposedMatch,
): Promise<WebComposedMatch> {
  const hydratedRounds = await Promise.all(
    match.rounds.map((round) =>
      round.kind === "extra-time"
        ? unwrap(client.matches.getExtraTime(match.id))
        : unwrap(client.matches.getRound(match.id, Number(round.number))),
    ),
  );

  return {
    ...match,
    rounds: match.rounds.map((round, index) => {
      const hydratedRound = hydratedRounds[index];

      if (!hydratedRound) {
        throw new Error(`Could not hydrate match round ${round.matchId}`);
      }

      return {
        ...round,
        match: normalizePhysicalMatch(hydratedRound.match),
      };
    }),
  };
}

function normalizeMatchMetrics(metrics: MatchMetrics | null): WebMatchMetrics | null {
  if (!metrics) {
    return null;
  }

  if (Array.isArray(metrics)) {
    return metrics.map(normalizeMatchMetricRow);
  }

  return {
    overall: metrics.overall.map(normalizeMatchMetricRow),
    rounds: metrics.rounds.map((round) => ({
      ...round,
      metrics: round.metrics.map(normalizeMatchMetricRow),
    })),
  };
}

function normalizeMatchMetricRow(row: MatchMetricRow): WebMatchMetricRow {
  return {
    ...row,
    metrics: normalizeJsonRecord(row.metrics),
  };
}

function normalizeMatchEvent(event: MatchEvent): WebMatchEvent {
  return {
    ...event,
    value: normalizeJsonValue(event.value),
  };
}

function normalizeMatchEventItem(
  item: MatchEvent | { round: WebRoundMatchEvent["round"]; event: MatchEvent },
): WebMatchEvent | WebRoundMatchEvent {
  return "event" in item
    ? {
        round: item.round,
        event: normalizeMatchEvent(item.event),
      }
    : normalizeMatchEvent(item);
}

function normalizeRoomProgramPage(
  page: ListRoomProgramsResponse | null,
): WebListRoomProgramsResponse {
  return page
    ? {
        ...page,
        items: page.items.map(normalizeRoomProgram),
      }
    : emptyPage<WebRoomProgram>();
}

function normalizeRoomProgram(program: RoomProgram): WebRoomProgram {
  return {
    ...program,
    liveStateContract: program.liveStateContract
      ? {
          ...program.liveStateContract,
          documents: program.liveStateContract.documents.map((document) => ({
            ...document,
            schema: normalizeJsonValue(document.schema),
          })),
        }
      : null,
  };
}

async function clearMatchCaches(ids: Array<string | null | undefined>) {
  const gameMode = getServerEnv().GAME_MODE_NAME;
  const listQueries = [{ gameMode }, { limit: 5, gameMode }, { limit: 50, gameMode }];
  const matchIds = ids.filter((id): id is string => Boolean(id));

  await Promise.all([
    ...listQueries.map((query) => deleteCachedJson(`public:matches:${JSON.stringify(query)}`)),
    deleteCachedJson("public:stats:player:top"),
    ...matchIds.flatMap((id) => [
      deleteCachedJson(`public:matches:${id}`),
      deleteCachedJson(`public:matches:${id}:events:${JSON.stringify({ limit: 100 })}`),
      deleteCachedJson(`public:matches:${id}:metrics`),
    ]),
  ]);
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
