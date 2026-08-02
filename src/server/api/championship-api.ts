import "@tanstack/react-start/server-only";

import type {
  ApiResult,
  ChampionshipAssignment,
  ChampionshipAuditEvent,
  ChampionshipCompetitionType,
  ChampionshipDetail,
  ChampionshipDraft,
  ChampionshipDraftCorrectionPreview,
  ChampionshipDraftQuery,
  ChampionshipFormat,
  ChampionshipFormatQuery,
  ChampionshipStandings,
  ChampionshipStandingsQuery,
  ChampionshipRoundRobinPreview,
  ChampionshipSpotPlacementPreview,
  ChampionshipDoubleEliminationPreview,
  ChampionshipEvidenceCandidates,
  ChampionshipEvidenceCandidatesQuery,
  ChampionshipMatchOperations,
  ChampionshipMatchOperationsQuery,
  ChampionshipMatchScheduling,
  ChampionshipMatchSchedulingQuery,
  ChampionshipMetricMappings,
  ChampionshipMetricMappingsQuery,
  ChampionshipHistory,
  ChampionshipHonor,
  ChampionshipHonorDefinition,
  ChampionshipHonorResolutionPreview,
  ArchiveChampionshipHonorDefinitionInput,
  CreateChampionshipHonorDefinitionInput,
  CreateChampionshipHonorGrantInput,
  CreateChampionshipHonorInput,
  PublishChampionshipHonorDefinitionInput,
  RevokeChampionshipHonorGrantInput,
  ResolveChampionshipHonorInput,
  UpdateChampionshipHonorDefinitionDraftInput,
  UpdateChampionshipHonorInput,
  ListChampionshipHonorDefinitionsResponse,
  ListChampionshipHonorsResponse,
  ChampionshipAward,
  CreateChampionshipAwardInput,
  UpdateChampionshipAwardInput,
  ReplaceChampionshipPlacementsInput,
  ChampionshipParticipant,
  ChampionshipPresence,
  ChampionshipRosterMembership,
  ChampionshipRosterMovePreview,
  ChampionshipSalaryProjection,
  ChampionshipInboxItem,
  ChampionshipSavedView,
  ChampionshipTeam,
  ChampionshipTeamIdentity,
  ChampionshipThread,
  ChampionshipTrade,
  ChampionshipTradesQuery,
  ChampionshipSettlementPreview,
  ChampionshipStatistics,
  ChampionshipStatisticsQuery,
  ChampionshipComment,
  CreateChampionshipAssignmentInput,
  CreateChampionshipParticipantInput,
  CreateChampionshipThreadInput,
  AddChampionshipCommentInput,
  AttachChampionshipMatchEvidenceInput,
  ChampionshipPresenceInput,
  UpdateChampionshipAssignmentInput,
  UpdateChampionshipInboxItemInput,
  UpdateChampionshipThreadInput,
  UpsertChampionshipSavedViewInput,
  CreateChampionshipInput,
  CreateChampionshipTeamInput,
  ConfigureChampionshipDraftInput,
  CancelChampionshipDraftInput,
  CreateChampionshipCompetitionRoundInput,
  CreateChampionshipLogicalMatchInput,
  CreateChampionshipScheduleProposalInput,
  CreateChampionshipRouteInput,
  CreateChampionshipSpotInput,
  CreateChampionshipStageInput,
  CreateChampionshipGroupInput,
  CreateChampionshipTradeInput,
  CreateCompetitionTypeInput,
  CreateTeamIdentityInput,
  ExecuteChampionshipRosterMoveInput,
  ReorderChampionshipRosterInput,
  EndChampionshipDraftInput,
  GenerateSingleEliminationInput,
  GenerateDoubleEliminationInput,
  GenerateChampionshipRoundRobinInput,
  ConfigureChampionshipStandingsInput,
  FreezeChampionshipPricesInput,
  ListChampionshipsResponse,
  ListChampionshipTradesResponse,
  ListCompetitionTypesResponse,
  ListAccountsQuery,
  ListAccountsResponse,
  ListRoomProgramsResponse,
  PaginatedResponse,
  MakeChampionshipDraftPickInput,
  PlaceChampionshipSpotInput,
  TransitionChampionshipInput,
  TransitionChampionshipRegistrationInput,
  UpdateChampionshipInput,
  UpdateChampionshipParticipantInput,
  UpdateChampionshipRoomProgramInput,
  UpdateChampionshipTeamInput,
  UpdateCompetitionTypeInput,
  UpdateChampionshipRouteInput,
  UpdateChampionshipStageInput,
  UpdateTeamIdentityInput,
  UpsertChampionshipPricesInput,
  PreviewChampionshipRosterMoveInput,
  PreviewDoubleEliminationInput,
  PreviewChampionshipClassificationInput,
  PreviewChampionshipRoundRobinInput,
  PreviewChampionshipSpotPlacementInput,
  ApplyChampionshipClassificationInput,
  SelfRegisterChampionshipInput,
  StartChampionshipDraftInput,
  ScheduleChampionshipMatchInput,
  AuthorizeChampionshipLatePlayInput,
  DecideChampionshipScheduleProposalInput,
  RemindChampionshipScheduleInput,
  RevokeChampionshipLatePlayInput,
  DecideChampionshipTradeInput,
  DetachChampionshipMatchEvidenceInput,
  PreviewChampionshipSettlementInput,
  ReplaceChampionshipMetricMappingsInput,
  SettleChampionshipMatchInput,
  UpdateChampionshipAttributionsInput,
  VoidChampionshipDraftPickInput,
  WithdrawChampionshipRegistrationInput,
} from "@haxbrasil/haxfootball-api-sdk";
import { getApiClient } from "#/server/api/haxfootball";

export type PublicChampionshipDetail = {
  championship: Serializable<ChampionshipDetail>;
  teams: Serializable<PaginatedResponse<ChampionshipTeam>>;
  participants: Serializable<PaginatedResponse<ChampionshipParticipant>>;
  salary: Serializable<ChampionshipSalaryProjection>;
  draft: Serializable<ChampionshipDraft>;
  trades: Serializable<ListChampionshipTradesResponse>;
  format: Serializable<ChampionshipFormat>;
  statistics: ChampionshipStatisticsData;
  history: ChampionshipHistoryData;
  honors: ChampionshipHonorsData;
  selfRegistration: Serializable<ChampionshipParticipant> | null;
  visualizations: {
    overview: import("#/features/visualizations/types").VisualizationDashboard;
    statistics: import("#/features/visualizations/types").VisualizationDashboard;
  };
};

export type ChampionshipAdminIndexData = {
  championships: Serializable<ListChampionshipsResponse>;
  competitionTypes: Serializable<ListCompetitionTypesResponse>;
  roomPrograms: Serializable<ListRoomProgramsResponse>;
};

export type ChampionshipWorkspaceData = {
  championship: Serializable<ChampionshipDetail>;
  teams: Serializable<PaginatedResponse<ChampionshipTeam>>;
  participants: Serializable<PaginatedResponse<ChampionshipParticipant>>;
  teamIdentities: Serializable<PaginatedResponse<ChampionshipTeamIdentity>>;
  roomPrograms: Serializable<ListRoomProgramsResponse>;
  audit: Serializable<PaginatedResponse<ChampionshipAuditEvent>>;
  threads: Serializable<PaginatedResponse<ChampionshipThread>>;
  assignments: Serializable<PaginatedResponse<ChampionshipAssignment>>;
  presence: Serializable<ChampionshipPresence[]>;
  inbox: Serializable<PaginatedResponse<ChampionshipInboxItem>>;
  savedViews: Serializable<PaginatedResponse<ChampionshipSavedView>>;
  salary: Serializable<ChampionshipSalaryProjection>;
  rosterHistory: Serializable<PaginatedResponse<ChampionshipRosterMembership>>;
  draft: Serializable<ChampionshipDraft>;
  trades: Serializable<ListChampionshipTradesResponse>;
  format: Serializable<ChampionshipFormat>;
  history: ChampionshipHistoryData;
  honors: ChampionshipHonorsData;
  honorDefinitions: ChampionshipHonorDefinitionsData;
  accounts: ChampionshipAccountOptions;
};

export type ChampionshipAccountOptions = {
  items: Array<{ uuid: string; name: string }>;
  page: { limit: number; nextCursor: string | null };
};

export type ChampionshipMutationResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      message: string;
      code?: string;
      conflict?: {
        currentRevision?: number;
        currentChangeSequence?: number;
      };
    };

export type ChampionshipMatchOperationsData = Serializable<ChampionshipMatchOperations>;
export type ChampionshipMatchSchedulingData = Serializable<ChampionshipMatchScheduling>;
export type ChampionshipStandingsData = Serializable<ChampionshipStandings>;
export type ChampionshipRoundRobinPreviewData = Serializable<ChampionshipRoundRobinPreview>;
export type ChampionshipSpotPlacementPreviewData = Serializable<ChampionshipSpotPlacementPreview>;
export type ChampionshipEvidenceCandidatesData = Serializable<ChampionshipEvidenceCandidates>;
export type ChampionshipSettlementPreviewData = Serializable<ChampionshipSettlementPreview>;
export type ChampionshipStatisticsData = Serializable<ChampionshipStatistics>;
export type ChampionshipMetricMappingsData = Serializable<ChampionshipMetricMappings>;
export type ChampionshipHistoryData = Serializable<ChampionshipHistory>;
export type ChampionshipAwardData = Serializable<ChampionshipAward>;
export type ChampionshipHonorData = Serializable<ChampionshipHonor>;
export type ChampionshipHonorDefinitionData = Serializable<ChampionshipHonorDefinition>;
export type ChampionshipHonorResolutionPreviewData =
  Serializable<ChampionshipHonorResolutionPreview>;
export type ChampionshipHonorsData = Serializable<ListChampionshipHonorsResponse>;
export type ChampionshipHonorDefinitionsData =
  Serializable<ListChampionshipHonorDefinitionsResponse>;
export type ChampionshipHonorCatalogData = {
  definitions: ChampionshipHonorDefinitionsData;
  competitionTypes: Serializable<ListCompetitionTypesResponse>;
};

type JsonPrimitive = boolean | null | number | string;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
const championshipHistoryPageLimit = 100;

export type Serializable<T> = unknown extends T
  ? JsonValue
  : T extends JsonPrimitive
    ? T
    : T extends readonly (infer Item)[]
      ? Serializable<Item>[]
      : T extends object
        ? { [Key in keyof T]: Serializable<T[Key]> }
        : never;

export async function listPublicChampionships(): Promise<Serializable<ListChampionshipsResponse>> {
  const client = requireClient();

  return serialize(
    await requireResult(
      client.championships.list({
        visibility: "public",
        limit: 24,
      }),
    ),
  );
}

export async function getPublicChampionshipBySlug(
  slug: string,
  actorAccountUuid?: string,
): Promise<PublicChampionshipDetail | null> {
  const client = requireClient();
  const list = await requireResult(
    client.championships.list({
      slug,
      visibility: "public",
      limit: 1,
    }),
  );
  const summary = list.items[0];

  if (!summary) {
    return null;
  }

  const [
    championship,
    teams,
    participants,
    salary,
    draft,
    trades,
    format,
    statistics,
    history,
    honors,
    selfRegistration,
    overviewVisualizations,
    statisticsVisualizations,
  ] = await Promise.all([
    requireResult(client.championships.get(summary.uuid)),
    requireResult(client.championships.teams.list(summary.uuid, { limit: 64 })),
    requireResult(client.championships.participants.list(summary.uuid, { limit: 100 })),
    requireResult(
      client.championships.salary.getPublic(summary.uuid, {
        participantLimit: 100,
        teamLimit: 100,
      }),
    ),
    requireResult(
      client.championships.draft.get(summary.uuid, {
        ...(actorAccountUuid ? { actorAccountUuid } : {}),
        turnLimit: 100,
        participantLimit: 100,
      }),
    ),
    requireResult(
      client.championships.trades.list(summary.uuid, {
        visibility: "public",
        state: "accepted",
        limit: 50,
      }),
    ),
    requireResult(
      client.championships.format.get(summary.uuid, {
        ...(actorAccountUuid ? { actorAccountUuid } : {}),
        limit: 500,
      }),
    ),
    requireResult(
      client.championships.statistics.get(summary.uuid, {
        limit: 200,
        offset: 0,
      }),
    ),
    requireResult(
      client.championships.history.get(summary.uuid, { limit: championshipHistoryPageLimit }),
    ),
    requireResult(client.championships.honors.list(summary.uuid, { limit: 100 })),
    actorAccountUuid
      ? requireResult(
          client.championships.registration.getSelf(summary.uuid, {
            actorAccountUuid,
          }),
        ).then(({ participant }) => participant)
      : Promise.resolve(null),
    requireResult(
      client.request({
        path: `/visualizations/championships/${summary.uuid}`,
        query: { surface: "overview" },
      }),
    ) as Promise<import("#/features/visualizations/types").VisualizationDashboard>,
    requireResult(
      client.request({
        path: `/visualizations/championships/${summary.uuid}`,
        query: { surface: "statistics" },
      }),
    ) as Promise<import("#/features/visualizations/types").VisualizationDashboard>,
  ]);

  return serialize({
    championship,
    teams,
    participants,
    salary,
    draft,
    trades,
    format,
    statistics,
    history,
    honors,
    selfRegistration,
    visualizations: { overview: overviewVisualizations, statistics: statisticsVisualizations },
  });
}

export async function listChampionshipAdminIndex(): Promise<ChampionshipAdminIndexData> {
  const client = requireClient();
  const [championships, competitionTypes, roomPrograms] = await Promise.all([
    requireResult(
      client.championships.list({
        visibility: "all",
        limit: 50,
      }),
    ),
    requireResult(
      client.championships.types.list({
        state: "all",
        limit: 50,
      }),
    ),
    requireResult(client.rooms.programs.list({ limit: 100 })),
  ]);

  return serialize({ championships, competitionTypes, roomPrograms });
}

export async function getChampionshipWorkspace(
  championshipUuid: string,
  actorAccountUuid: string,
): Promise<ChampionshipWorkspaceData> {
  const client = requireClient();
  const [
    championship,
    teams,
    participants,
    teamIdentities,
    roomPrograms,
    audit,
    threads,
    assignments,
    inbox,
    savedViews,
    salary,
    rosterHistory,
    draft,
    trades,
    format,
    history,
    honors,
    honorDefinitions,
    accounts,
  ] = await Promise.all([
    requireResult(client.championships.get(championshipUuid)),
    requireResult(client.championships.teams.list(championshipUuid, { limit: 64 })),
    requireResult(client.championships.participants.list(championshipUuid, { limit: 100 })),
    requireResult(client.championships.teamIdentities.list({ limit: 100 })),
    requireResult(client.rooms.programs.list({ limit: 100 })),
    requireResult(
      client.championships.audit.list(championshipUuid, {
        actorAccountUuid,
        limit: 50,
      }),
    ),
    requireResult(
      client.championships.collaboration.threads.list(championshipUuid, {
        actorAccountUuid,
        limit: 50,
      }),
    ),
    requireResult(
      client.championships.collaboration.assignments.list(championshipUuid, {
        actorAccountUuid,
        limit: 50,
      }),
    ),
    requireResult(
      client.championships.collaboration.inbox.list({
        actorAccountUuid,
        limit: 30,
      }),
    ),
    requireResult(
      client.championships.collaboration.savedViews.list(championshipUuid, {
        actorAccountUuid,
        surface: "workspace",
        limit: 20,
      }),
    ),
    requireResult(
      client.championships.salary.getAdmin(championshipUuid, {
        actorAccountUuid,
        participantLimit: 100,
        teamLimit: 100,
      }),
    ),
    requireResult(client.championships.rosters.history(championshipUuid, { limit: 100 })),
    requireResult(
      client.championships.draft.get(championshipUuid, {
        actorAccountUuid,
        turnLimit: 100,
        participantLimit: 100,
      }),
    ),
    requireResult(
      client.championships.trades.list(championshipUuid, {
        actorAccountUuid,
        visibility: "admin",
        limit: 100,
      }),
    ),
    requireResult(
      client.championships.format.get(championshipUuid, {
        actorAccountUuid,
        limit: 500,
      }),
    ),
    requireResult(
      client.championships.history.get(championshipUuid, {
        actorAccountUuid,
        limit: championshipHistoryPageLimit,
      }),
    ),
    requireResult(
      client.championships.honors.list(championshipUuid, {
        actorAccountUuid,
        includeDrafts: true,
        limit: 100,
      }),
    ),
    requireResult(client.championships.honorDefinitions.list({ state: "active", limit: 100 })),
    listChampionshipAccountOptions({ limit: 100 }),
  ]);
  const presence = await requireResult(
    client.championships.collaboration.presence.list(championshipUuid, {
      actorAccountUuid,
    }),
  );

  return serialize({
    championship,
    teams,
    participants,
    teamIdentities,
    roomPrograms,
    audit,
    threads,
    assignments,
    presence,
    inbox,
    savedViews,
    salary,
    rosterHistory,
    draft,
    trades,
    format,
    history,
    honors,
    honorDefinitions,
    accounts,
  });
}

export async function replaceChampionshipPlacements(
  championshipUuid: string,
  input: ReplaceChampionshipPlacementsInput,
): Promise<ChampionshipMutationResult<ChampionshipHistoryData>> {
  return mutationResult(
    requireClient().championships.history.replacePlacements(championshipUuid, input),
  );
}

export async function createChampionshipAward(
  championshipUuid: string,
  input: CreateChampionshipAwardInput,
): Promise<ChampionshipMutationResult<ChampionshipAwardData>> {
  return mutationResult(requireClient().championships.history.createAward(championshipUuid, input));
}

export async function updateChampionshipAward(
  championshipUuid: string,
  awardUuid: string,
  input: UpdateChampionshipAwardInput,
): Promise<ChampionshipMutationResult<ChampionshipAwardData>> {
  return mutationResult(
    requireClient().championships.history.updateAward(championshipUuid, awardUuid, input),
  );
}

export async function listChampionshipHonorCatalog(): Promise<ChampionshipHonorCatalogData> {
  const client = requireClient();
  const [definitions, competitionTypes] = await Promise.all([
    requireResult(client.championships.honorDefinitions.list({ state: "all", limit: 100 })),
    requireResult(client.championships.types.list({ state: "all", limit: 100 })),
  ]);
  return serialize({ definitions, competitionTypes });
}

export async function createChampionshipHonorDefinition(
  input: CreateChampionshipHonorDefinitionInput,
): Promise<ChampionshipMutationResult<ChampionshipHonorDefinitionData>> {
  return mutationResult(requireClient().championships.honorDefinitions.create(input));
}

export async function updateChampionshipHonorDefinitionDraft(
  definitionUuid: string,
  input: UpdateChampionshipHonorDefinitionDraftInput,
): Promise<ChampionshipMutationResult<ChampionshipHonorDefinitionData>> {
  return mutationResult(
    requireClient().championships.honorDefinitions.updateDraft(definitionUuid, input),
  );
}

export async function publishChampionshipHonorDefinition(
  definitionUuid: string,
  input: PublishChampionshipHonorDefinitionInput,
): Promise<ChampionshipMutationResult<ChampionshipHonorDefinitionData & { published: boolean }>> {
  return mutationResult(
    requireClient().championships.honorDefinitions.publish(definitionUuid, input),
  );
}

export async function archiveChampionshipHonorDefinition(
  definitionUuid: string,
  input: ArchiveChampionshipHonorDefinitionInput,
): Promise<ChampionshipMutationResult<ChampionshipHonorDefinitionData>> {
  return mutationResult(
    requireClient().championships.honorDefinitions.archive(definitionUuid, input),
  );
}

export async function createChampionshipHonor(
  championshipUuid: string,
  input: CreateChampionshipHonorInput,
): Promise<ChampionshipMutationResult<ChampionshipHonorData>> {
  return mutationResult(requireClient().championships.honors.create(championshipUuid, input));
}

export async function updateChampionshipHonor(
  championshipUuid: string,
  honorUuid: string,
  input: UpdateChampionshipHonorInput,
): Promise<ChampionshipMutationResult<ChampionshipHonorData>> {
  return mutationResult(
    requireClient().championships.honors.update(championshipUuid, honorUuid, input),
  );
}

export async function createChampionshipHonorGrant(
  championshipUuid: string,
  honorUuid: string,
  input: CreateChampionshipHonorGrantInput,
): Promise<ChampionshipMutationResult<ChampionshipHonorData>> {
  return mutationResult(
    requireClient().championships.honors.grant(championshipUuid, honorUuid, input),
  );
}

export async function previewChampionshipHonorResolution(
  championshipUuid: string,
  honorUuid: string,
  actorAccountUuid: string,
): Promise<ChampionshipHonorResolutionPreviewData> {
  return serialize(
    await requireResult(
      requireClient().championships.honors.previewResolution(championshipUuid, honorUuid, {
        actorAccountUuid,
      }),
    ),
  );
}

export async function resolveChampionshipHonor(
  championshipUuid: string,
  honorUuid: string,
  input: ResolveChampionshipHonorInput,
): Promise<ChampionshipMutationResult<ChampionshipHonorData>> {
  return mutationResult(
    requireClient().championships.honors.resolve(championshipUuid, honorUuid, input),
  );
}

export async function revokeChampionshipHonorGrant(
  championshipUuid: string,
  honorUuid: string,
  grantUuid: string,
  input: RevokeChampionshipHonorGrantInput,
): Promise<ChampionshipMutationResult<ChampionshipHonorData>> {
  return mutationResult(
    requireClient().championships.honors.revokeGrant(championshipUuid, honorUuid, grantUuid, input),
  );
}

export async function getChampionshipDraftProjection(
  championshipUuid: string,
  query: ChampionshipDraftQuery,
): Promise<Serializable<ChampionshipDraft>> {
  return serialize(
    await requireResult(requireClient().championships.draft.get(championshipUuid, query)),
  );
}

export async function getChampionshipTradesProjection(
  championshipUuid: string,
  query: ChampionshipTradesQuery,
): Promise<Serializable<ListChampionshipTradesResponse>> {
  return serialize(
    await requireResult(requireClient().championships.trades.list(championshipUuid, query)),
  );
}

export async function getChampionshipFormatProjection(
  championshipUuid: string,
  query: ChampionshipFormatQuery,
): Promise<Serializable<ChampionshipFormat>> {
  return serialize(
    await requireResult(requireClient().championships.format.get(championshipUuid, query)),
  );
}

export async function getChampionshipStandingsProjection(
  championshipUuid: string,
  stageUuid: string,
  groupUuid: string,
  query?: ChampionshipStandingsQuery,
): Promise<ChampionshipStandingsData> {
  return serialize(
    await requireResult(
      requireClient().championships.format.getStandings(
        championshipUuid,
        stageUuid,
        groupUuid,
        query,
      ),
    ),
  );
}

export async function getChampionshipMatchOperations(
  championshipUuid: string,
  championshipMatchUuid: string,
  query: ChampionshipMatchOperationsQuery,
): Promise<ChampionshipMatchOperationsData> {
  return serialize(
    await requireResult(
      requireClient().championships.matches.get(championshipUuid, championshipMatchUuid, query),
    ),
  );
}

export async function listChampionshipEvidenceCandidates(
  championshipUuid: string,
  championshipMatchUuid: string,
  query: ChampionshipEvidenceCandidatesQuery,
): Promise<ChampionshipEvidenceCandidatesData> {
  return serialize(
    await requireResult(
      requireClient().championships.matches.listEvidenceCandidates(
        championshipUuid,
        championshipMatchUuid,
        query,
      ),
    ),
  );
}

export async function attachChampionshipMatchEvidence(
  championshipUuid: string,
  championshipMatchUuid: string,
  input: AttachChampionshipMatchEvidenceInput,
): Promise<ChampionshipMutationResult<ChampionshipMatchOperationsData>> {
  return mutationResult(
    requireClient().championships.matches.attachEvidence(
      championshipUuid,
      championshipMatchUuid,
      input,
    ),
  );
}

export async function detachChampionshipMatchEvidence(
  championshipUuid: string,
  championshipMatchUuid: string,
  input: DetachChampionshipMatchEvidenceInput,
): Promise<ChampionshipMutationResult<ChampionshipMatchOperationsData>> {
  return mutationResult(
    requireClient().championships.matches.detachEvidence(
      championshipUuid,
      championshipMatchUuid,
      input,
    ),
  );
}

export async function previewChampionshipMatchSettlement(
  championshipUuid: string,
  championshipMatchUuid: string,
  input: PreviewChampionshipSettlementInput,
  correction: boolean,
): Promise<ChampionshipSettlementPreviewData> {
  const matches = requireClient().championships.matches;

  return serialize(
    await requireResult(
      correction
        ? matches.previewCorrection(championshipUuid, championshipMatchUuid, input)
        : matches.previewSettlement(championshipUuid, championshipMatchUuid, input),
    ),
  );
}

export async function settleChampionshipMatch(
  championshipUuid: string,
  championshipMatchUuid: string,
  input: SettleChampionshipMatchInput,
  correction: boolean,
): Promise<ChampionshipMutationResult<ChampionshipMatchOperationsData>> {
  const matches = requireClient().championships.matches;

  return mutationResult(
    correction
      ? matches.correct(championshipUuid, championshipMatchUuid, input)
      : matches.settle(championshipUuid, championshipMatchUuid, input),
  );
}

export async function updateChampionshipMatchAttributions(
  championshipUuid: string,
  championshipMatchUuid: string,
  input: UpdateChampionshipAttributionsInput,
): Promise<ChampionshipMutationResult<ChampionshipMatchOperationsData>> {
  return mutationResult(
    requireClient().championships.matches.updateAttributions(
      championshipUuid,
      championshipMatchUuid,
      input,
    ),
  );
}

export async function getChampionshipStatistics(
  championshipUuid: string,
  query: ChampionshipStatisticsQuery,
): Promise<ChampionshipStatisticsData> {
  return serialize(
    await requireResult(requireClient().championships.statistics.get(championshipUuid, query)),
  );
}

export async function listChampionshipMetricMappings(
  championshipUuid: string,
  query: ChampionshipMetricMappingsQuery,
): Promise<ChampionshipMetricMappingsData> {
  return serialize(
    await requireResult(
      requireClient().championships.statistics.listMappings(championshipUuid, query),
    ),
  );
}

export async function replaceChampionshipMetricMappings(
  championshipUuid: string,
  input: ReplaceChampionshipMetricMappingsInput,
): Promise<ChampionshipMutationResult<ChampionshipMetricMappingsData>> {
  return mutationResult(
    requireClient().championships.statistics.replaceMappings(championshipUuid, input),
  );
}

export async function getChampionshipSalaryWorkspacePage(
  championshipUuid: string,
  actorAccountUuid: string,
  query: {
    participantCursor?: string;
    teamCursor?: string;
    participantLimit?: number;
    teamLimit?: number;
  },
): Promise<Serializable<ChampionshipSalaryProjection>> {
  return serialize(
    await requireResult(
      requireClient().championships.salary.getAdmin(championshipUuid, {
        actorAccountUuid,
        ...query,
      }),
    ),
  );
}

export async function searchChampionshipAccounts(
  query: ListAccountsQuery,
): Promise<ChampionshipAccountOptions> {
  return listChampionshipAccountOptions(query);
}

async function listChampionshipAccountOptions(
  query: ListAccountsQuery,
): Promise<ChampionshipAccountOptions> {
  const response: Serializable<ListAccountsResponse> = serialize(
    await requireResult(requireClient().accounts.list(query)),
  );

  return {
    items: response.items.map(({ uuid, name }) => ({ uuid, name })),
    page: {
      limit: Number(response.page.limit),
      nextCursor: response.page.nextCursor,
    },
  };
}

export async function createCompetitionType(
  input: CreateCompetitionTypeInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipCompetitionType>>> {
  return mutationResult(requireClient().championships.types.create(input));
}

export async function updateCompetitionType(
  uuid: string,
  input: UpdateCompetitionTypeInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipCompetitionType>>> {
  return mutationResult(requireClient().championships.types.update(uuid, input));
}

export async function createChampionship(
  input: CreateChampionshipInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDetail>>> {
  return mutationResult(requireClient().championships.create(input));
}

export async function updateChampionship(
  uuid: string,
  input: UpdateChampionshipInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDetail>>> {
  return mutationResult(requireClient().championships.update(uuid, input));
}

export async function transitionChampionship(
  uuid: string,
  input: TransitionChampionshipInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDetail>>> {
  return mutationResult(requireClient().championships.transition(uuid, input));
}

export async function createTeamIdentity(
  championshipUuid: string,
  input: CreateTeamIdentityInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipTeamIdentity>>> {
  return mutationResult(
    requireClient().championships.teamIdentities.create(championshipUuid, input),
  );
}

export async function updateTeamIdentity(
  championshipUuid: string,
  identityUuid: string,
  input: UpdateTeamIdentityInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipTeamIdentity>>> {
  return mutationResult(
    requireClient().championships.teamIdentities.update(championshipUuid, identityUuid, input),
  );
}

export async function createChampionshipTeam(
  championshipUuid: string,
  input: CreateChampionshipTeamInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipTeam>>> {
  return mutationResult(requireClient().championships.teams.create(championshipUuid, input));
}

export async function updateChampionshipTeam(
  championshipUuid: string,
  teamUuid: string,
  input: UpdateChampionshipTeamInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipTeam>>> {
  return mutationResult(
    requireClient().championships.teams.update(championshipUuid, teamUuid, input),
  );
}

export async function transitionChampionshipRegistration(
  championshipUuid: string,
  input: TransitionChampionshipRegistrationInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDetail>>> {
  return mutationResult(
    requireClient().championships.registration.transition(championshipUuid, input),
  );
}

export async function selfRegisterChampionship(
  championshipUuid: string,
  input: SelfRegisterChampionshipInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipParticipant>>> {
  return mutationResult(
    requireClient().championships.registration.selfRegister(championshipUuid, input),
  );
}

export async function withdrawChampionshipRegistration(
  championshipUuid: string,
  input: WithdrawChampionshipRegistrationInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipParticipant>>> {
  return mutationResult(
    requireClient().championships.registration.withdraw(championshipUuid, input),
  );
}

export async function createChampionshipParticipant(
  championshipUuid: string,
  input: CreateChampionshipParticipantInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipParticipant>>> {
  return mutationResult(requireClient().championships.participants.create(championshipUuid, input));
}

export async function updateChampionshipParticipant(
  championshipUuid: string,
  participantUuid: string,
  input: UpdateChampionshipParticipantInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipParticipant>>> {
  return mutationResult(
    requireClient().championships.participants.update(championshipUuid, participantUuid, input),
  );
}

export async function upsertChampionshipPrices(
  championshipUuid: string,
  input: UpsertChampionshipPricesInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipSalaryProjection>>> {
  return mutationResult(requireClient().championships.salary.upsertPrices(championshipUuid, input));
}

export async function freezeChampionshipPrices(
  championshipUuid: string,
  input: FreezeChampionshipPricesInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipSalaryProjection>>> {
  return mutationResult(requireClient().championships.salary.freezePrices(championshipUuid, input));
}

export async function previewChampionshipRosterMove(
  championshipUuid: string,
  input: PreviewChampionshipRosterMoveInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipRosterMovePreview>>> {
  return mutationResult(requireClient().championships.rosters.previewMove(championshipUuid, input));
}

export async function executeChampionshipRosterMove(
  championshipUuid: string,
  input: ExecuteChampionshipRosterMoveInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipRosterMembership>>> {
  return mutationResult(requireClient().championships.rosters.executeMove(championshipUuid, input));
}

export async function reorderChampionshipRoster(
  championshipUuid: string,
  input: ReorderChampionshipRosterInput,
) {
  return mutationResult(requireClient().championships.rosters.reorder(championshipUuid, input));
}

export async function configureChampionshipDraft(
  championshipUuid: string,
  input: ConfigureChampionshipDraftInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDraft>>> {
  return mutationResult(requireClient().championships.draft.configure(championshipUuid, input));
}

export async function startChampionshipDraft(
  championshipUuid: string,
  input: StartChampionshipDraftInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDraft>>> {
  return mutationResult(requireClient().championships.draft.start(championshipUuid, input));
}

export async function makeChampionshipDraftPick(
  championshipUuid: string,
  input: MakeChampionshipDraftPickInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDraft>>> {
  return mutationResult(requireClient().championships.draft.pick(championshipUuid, input));
}

export async function endChampionshipDraft(
  championshipUuid: string,
  input: EndChampionshipDraftInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDraft>>> {
  return mutationResult(requireClient().championships.draft.end(championshipUuid, input));
}

export async function cancelChampionshipDraft(
  championshipUuid: string,
  input: CancelChampionshipDraftInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDraft>>> {
  return mutationResult(requireClient().championships.draft.cancel(championshipUuid, input));
}

export async function previewChampionshipDraftCorrection(
  championshipUuid: string,
  turnUuid: string,
  actorAccountUuid: string,
): Promise<Serializable<ChampionshipDraftCorrectionPreview>> {
  return serialize(
    await requireResult(
      requireClient().championships.draft.previewCorrection(championshipUuid, turnUuid, {
        actorAccountUuid,
      }),
    ),
  );
}

export async function reverseChampionshipDraftPick(
  championshipUuid: string,
  turnUuid: string,
  input: VoidChampionshipDraftPickInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDraft>>> {
  return mutationResult(
    requireClient().championships.draft.reversePick(championshipUuid, turnUuid, input),
  );
}

export async function createChampionshipTrade(
  championshipUuid: string,
  input: CreateChampionshipTradeInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipTrade>>> {
  return mutationResult(requireClient().championships.trades.create(championshipUuid, input));
}

export async function decideChampionshipTrade(
  championshipUuid: string,
  tradeUuid: string,
  action: "accept" | "reject" | "cancel",
  input: DecideChampionshipTradeInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipTrade>>> {
  return mutationResult(
    requireClient().championships.trades[action](championshipUuid, tradeUuid, input),
  );
}

export async function createChampionshipStage(
  championshipUuid: string,
  input: CreateChampionshipStageInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(requireClient().championships.format.createStage(championshipUuid, input));
}

export async function updateChampionshipStage(
  championshipUuid: string,
  stageUuid: string,
  input: UpdateChampionshipStageInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(
    requireClient().championships.format.updateStage(championshipUuid, stageUuid, input),
  );
}

export async function deleteChampionshipStage(
  championshipUuid: string,
  stageUuid: string,
  input: { actorAccountUuid: string; commandUuid: string; expectedRevision: number },
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(
    requireClient().championships.format.deleteStage(championshipUuid, stageUuid, input),
  );
}

export async function createChampionshipGroup(
  championshipUuid: string,
  stageUuid: string,
  input: CreateChampionshipGroupInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(
    requireClient().championships.format.createGroup(championshipUuid, stageUuid, input),
  );
}

export async function configureChampionshipStandings(
  championshipUuid: string,
  stageUuid: string,
  input: ConfigureChampionshipStandingsInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(
    requireClient().championships.format.configureStandings(championshipUuid, stageUuid, input),
  );
}

export async function previewChampionshipRoundRobin(
  championshipUuid: string,
  stageUuid: string,
  input: PreviewChampionshipRoundRobinInput,
): Promise<ChampionshipMutationResult<ChampionshipRoundRobinPreviewData>> {
  return mutationResult(
    requireClient().championships.format.previewRoundRobin(championshipUuid, stageUuid, input),
  );
}

export async function generateChampionshipRoundRobin(
  championshipUuid: string,
  stageUuid: string,
  input: GenerateChampionshipRoundRobinInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(
    requireClient().championships.format.generateRoundRobin(championshipUuid, stageUuid, input),
  );
}

export async function previewChampionshipClassification(
  championshipUuid: string,
  stageUuid: string,
  groupUuid: string,
  input: PreviewChampionshipClassificationInput,
): Promise<ChampionshipMutationResult<ChampionshipStandingsData>> {
  return mutationResult(
    requireClient().championships.format.previewClassification(
      championshipUuid,
      stageUuid,
      groupUuid,
      input,
    ),
  );
}

export async function applyChampionshipClassification(
  championshipUuid: string,
  stageUuid: string,
  groupUuid: string,
  input: ApplyChampionshipClassificationInput,
): Promise<ChampionshipMutationResult<ChampionshipStandingsData>> {
  return mutationResult(
    requireClient().championships.format.applyClassification(
      championshipUuid,
      stageUuid,
      groupUuid,
      input,
    ),
  );
}

export async function generateChampionshipSingleElimination(
  championshipUuid: string,
  input: GenerateSingleEliminationInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(
    requireClient().championships.format.generateSingleElimination(championshipUuid, input),
  );
}

export async function previewChampionshipDoubleElimination(
  championshipUuid: string,
  input: PreviewDoubleEliminationInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDoubleEliminationPreview>>> {
  return mutationResult(
    requireClient().championships.format.previewDoubleElimination(championshipUuid, input),
  );
}

export async function generateChampionshipDoubleElimination(
  championshipUuid: string,
  input: GenerateDoubleEliminationInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(
    requireClient().championships.format.generateDoubleElimination(championshipUuid, input),
  );
}

export async function createChampionshipSpot(
  championshipUuid: string,
  input: CreateChampionshipSpotInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(requireClient().championships.format.createSpot(championshipUuid, input));
}

export async function placeChampionshipSpot(
  championshipUuid: string,
  spotUuid: string,
  input: PlaceChampionshipSpotInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(
    requireClient().championships.format.placeSpot(championshipUuid, spotUuid, input),
  );
}

export async function previewChampionshipSpotPlacement(
  championshipUuid: string,
  spotUuid: string,
  input: PreviewChampionshipSpotPlacementInput,
): Promise<ChampionshipMutationResult<ChampionshipSpotPlacementPreviewData>> {
  return mutationResult(
    requireClient().championships.format.previewSpotPlacement(championshipUuid, spotUuid, input),
  );
}

export async function createChampionshipRoute(
  championshipUuid: string,
  input: CreateChampionshipRouteInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(requireClient().championships.format.createRoute(championshipUuid, input));
}

export async function updateChampionshipRoute(
  championshipUuid: string,
  routeUuid: string,
  input: UpdateChampionshipRouteInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(
    requireClient().championships.format.updateRoute(championshipUuid, routeUuid, input),
  );
}

export async function createChampionshipCompetitionRound(
  championshipUuid: string,
  input: CreateChampionshipCompetitionRoundInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(
    requireClient().championships.format.createCompetitionRound(championshipUuid, input),
  );
}

export async function createChampionshipLogicalMatch(
  championshipUuid: string,
  input: CreateChampionshipLogicalMatchInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(requireClient().championships.format.createMatch(championshipUuid, input));
}

export async function scheduleChampionshipLogicalMatch(
  championshipUuid: string,
  matchUuid: string,
  input: ScheduleChampionshipMatchInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipFormat>>> {
  return mutationResult(
    requireClient().championships.format.scheduleMatch(championshipUuid, matchUuid, input),
  );
}

export async function getChampionshipMatchScheduling(
  championshipUuid: string,
  matchUuid: string,
  query: ChampionshipMatchSchedulingQuery,
): Promise<Serializable<ChampionshipMatchScheduling>> {
  return serialize(
    await requireResult(
      requireClient().championships.scheduling.get(championshipUuid, matchUuid, query),
    ),
  );
}

export async function createChampionshipScheduleProposal(
  championshipUuid: string,
  matchUuid: string,
  input: CreateChampionshipScheduleProposalInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipMatchScheduling>>> {
  return mutationResult(
    requireClient().championships.scheduling.propose(championshipUuid, matchUuid, input),
  );
}

export async function decideChampionshipScheduleProposal(
  championshipUuid: string,
  matchUuid: string,
  proposalUuid: string,
  input: DecideChampionshipScheduleProposalInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipMatchScheduling>>> {
  return mutationResult(
    requireClient().championships.scheduling.decide(
      championshipUuid,
      matchUuid,
      proposalUuid,
      input,
    ),
  );
}

export async function authorizeChampionshipLatePlay(
  championshipUuid: string,
  matchUuid: string,
  input: AuthorizeChampionshipLatePlayInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipMatchScheduling>>> {
  return mutationResult(
    requireClient().championships.scheduling.authorizeLatePlay(championshipUuid, matchUuid, input),
  );
}

export async function revokeChampionshipLatePlay(
  championshipUuid: string,
  matchUuid: string,
  authorizationUuid: string,
  input: RevokeChampionshipLatePlayInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipMatchScheduling>>> {
  return mutationResult(
    requireClient().championships.scheduling.revokeLatePlay(
      championshipUuid,
      matchUuid,
      authorizationUuid,
      input,
    ),
  );
}

export async function remindChampionshipSchedule(
  championshipUuid: string,
  matchUuid: string,
  input: RemindChampionshipScheduleInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipMatchScheduling>>> {
  return mutationResult(
    requireClient().championships.scheduling.remind(championshipUuid, matchUuid, input),
  );
}

export async function changeChampionshipRoomProgram(
  championshipUuid: string,
  input: UpdateChampionshipRoomProgramInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipDetail>>> {
  return mutationResult(requireClient().championships.roomPrograms.change(championshipUuid, input));
}

export async function createChampionshipThread(
  championshipUuid: string,
  input: CreateChampionshipThreadInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipThread>>> {
  return mutationResult(
    requireClient().championships.collaboration.threads.create(championshipUuid, input),
  );
}

export async function addChampionshipComment(
  championshipUuid: string,
  threadUuid: string,
  input: AddChampionshipCommentInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipComment>>> {
  return mutationResult(
    requireClient().championships.collaboration.threads.addComment(
      championshipUuid,
      threadUuid,
      input,
    ),
  );
}

export async function createChampionshipAssignment(
  championshipUuid: string,
  input: CreateChampionshipAssignmentInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipAssignment>>> {
  return mutationResult(
    requireClient().championships.collaboration.assignments.create(championshipUuid, input),
  );
}

export async function updateChampionshipThread(
  championshipUuid: string,
  threadUuid: string,
  input: UpdateChampionshipThreadInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipThread>>> {
  return mutationResult(
    requireClient().championships.collaboration.threads.update(championshipUuid, threadUuid, input),
  );
}

export async function updateChampionshipAssignment(
  championshipUuid: string,
  assignmentUuid: string,
  input: UpdateChampionshipAssignmentInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipAssignment>>> {
  return mutationResult(
    requireClient().championships.collaboration.assignments.update(
      championshipUuid,
      assignmentUuid,
      input,
    ),
  );
}

export async function updateChampionshipInboxItem(
  inboxItemUuid: string,
  input: UpdateChampionshipInboxItemInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipInboxItem>>> {
  return mutationResult(
    requireClient().championships.collaboration.inbox.update(inboxItemUuid, input),
  );
}

export async function upsertChampionshipSavedView(
  championshipUuid: string,
  input: UpsertChampionshipSavedViewInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipSavedView>>> {
  return mutationResult(
    requireClient().championships.collaboration.savedViews.upsert(championshipUuid, input),
  );
}

export async function heartbeatChampionshipPresence(
  championshipUuid: string,
  input: ChampionshipPresenceInput,
): Promise<ChampionshipMutationResult<Serializable<ChampionshipPresence[]>>> {
  return mutationResult(
    requireClient().championships.collaboration.presence.heartbeat(championshipUuid, input),
  );
}

function requireClient() {
  const client = getApiClient();

  if (!client) {
    throw new Error("A API do HaxFootball não está configurada.");
  }

  return client;
}

async function requireResult<T>(request: Promise<ApiResult<T>>): Promise<T> {
  const result = await request;

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data;
}

async function mutationResult<T>(
  request: Promise<ApiResult<T>>,
): Promise<ChampionshipMutationResult<Serializable<T>>> {
  const result = await request;

  if (result.ok) {
    return { ok: true, data: serialize(result.data) };
  }

  const details = errorDetails(result.error.kind === "api" ? result.error.body : undefined);

  return {
    ok: false,
    message: result.error.message,
    ...(result.error.kind === "api" && result.error.code ? { code: result.error.code } : {}),
    ...(details ? { conflict: details } : {}),
  };
}

function serialize<T>(value: T): Serializable<T> {
  return JSON.parse(JSON.stringify(value)) as Serializable<T>;
}

function errorDetails(value: unknown) {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return null;
  }

  const error = (value as { error?: { details?: unknown } }).error;
  const details = error?.details;

  if (!details || typeof details !== "object") {
    return null;
  }

  const currentRevision = numberProperty(details, "currentRevision");
  const currentChangeSequence = numberProperty(details, "currentChangeSequence");

  return {
    ...(currentRevision === undefined ? {} : { currentRevision }),
    ...(currentChangeSequence === undefined ? {} : { currentChangeSequence }),
  };
}

function numberProperty(value: object, key: string): number | undefined {
  const property = (value as Record<string, unknown>)[key];

  return typeof property === "number" ? property : undefined;
}
