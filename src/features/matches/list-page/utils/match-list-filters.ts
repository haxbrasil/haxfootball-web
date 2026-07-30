import { matchSummaryPlayers, type MatchSummaryRoster } from "#/lib/matches/match-summary-players";
import { normalizeMatchIdInput } from "#/lib/matches/match-id";

type MatchWithScore = {
  score?: { red?: number | string | null; blue?: number | string | null } | null;
};

export function isScorelessMatch(match: MatchWithScore) {
  const red = match.score?.red;
  const blue = match.score?.blue;

  return red !== null && red !== undefined && blue !== null && blue !== undefined
    ? Number(red) === 0 && Number(blue) === 0
    : false;
}

export type MatchStatusFilter = "all" | "completed" | "unfinished";
export type MatchKindFilter = "all" | "single" | "composed";

export type MatchListFilterState = {
  hideScoreless: boolean;
  matchId: string;
  player: string;
  dateFrom: string;
  dateTo: string;
  minimumScore: string;
  maximumScore: string;
  status: MatchStatusFilter;
  kind: MatchKindFilter;
  requirePlayers: boolean;
};

export const defaultMatchListFilters: MatchListFilterState = {
  hideScoreless: true,
  matchId: "",
  player: "",
  dateFrom: "",
  dateTo: "",
  minimumScore: "",
  maximumScore: "",
  status: "all",
  kind: "all",
  requirePlayers: false,
};

type FilterableMatch = MatchWithScore &
  MatchSummaryRoster & {
    id: string;
    status: string;
    createdAt: string;
    initiatedAt?: string | null;
    kind: "single" | "composed";
  };

export function filterMatches<T extends FilterableMatch>(
  matches: T[],
  filters: MatchListFilterState,
): T[] {
  const matchId = normalizeMatchIdInput(filters.matchId);
  const player = filters.player.trim().toLocaleLowerCase("pt-BR");
  const minimumScore = parseOptionalNumber(filters.minimumScore);
  const maximumScore = parseOptionalNumber(filters.maximumScore);
  const dateFrom = parseDateBoundary(filters.dateFrom, "start");
  const dateTo = parseDateBoundary(filters.dateTo, "end");

  return matches.filter((match) => {
    if (filters.hideScoreless && isScorelessMatch(match)) {
      return false;
    }

    if (matchId && !normalizeMatchIdInput(match.id).includes(matchId)) {
      return false;
    }

    const players = matchSummaryPlayers(match);

    if (
      player &&
      !players.some((entry) => entry.name.toLocaleLowerCase("pt-BR").includes(player))
    ) {
      return false;
    }

    if (filters.requirePlayers && players.length === 0) {
      return false;
    }

    if (filters.status === "completed" && match.status !== "completed") {
      return false;
    }

    if (filters.status === "unfinished" && match.status === "completed") {
      return false;
    }

    if (filters.kind !== "all" && match.kind !== filters.kind) {
      return false;
    }

    const timestamp = Date.parse(match.initiatedAt ?? match.createdAt);

    if ((dateFrom !== null && timestamp < dateFrom) || (dateTo !== null && timestamp > dateTo)) {
      return false;
    }

    if (minimumScore !== null || maximumScore !== null) {
      const totalScore = getTotalScore(match);

      if (
        totalScore === null ||
        (minimumScore !== null && totalScore < minimumScore) ||
        (maximumScore !== null && totalScore > maximumScore)
      ) {
        return false;
      }
    }

    return true;
  });
}

export function getActiveMatchFilterLabels(filters: MatchListFilterState): string[] {
  const labels: string[] = [];

  if (filters.hideScoreless) labels.push("Sem 0 × 0");
  if (filters.matchId) labels.push(`ID: ${filters.matchId.toUpperCase()}`);
  if (filters.player) labels.push(`Jogador: ${filters.player}`);
  if (filters.dateFrom || filters.dateTo) labels.push("Período");
  if (filters.minimumScore || filters.maximumScore) labels.push("Placar");
  if (filters.status === "completed") labels.push("Finalizadas");
  if (filters.status === "unfinished") labels.push("Em aberto");
  if (filters.kind === "single") labels.push("Individuais");
  if (filters.kind === "composed") labels.push("Compostas");
  if (filters.requirePlayers) labels.push("Com jogadores");

  return labels;
}

function getTotalScore(match: MatchWithScore) {
  const red = match.score?.red;
  const blue = match.score?.blue;

  if (red === null || red === undefined || blue === null || blue === undefined) {
    return null;
  }

  const total = Number(red) + Number(blue);
  return Number.isFinite(total) ? total : null;
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateBoundary(value: string, boundary: "start" | "end") {
  if (!value) {
    return null;
  }

  const timestamp = new Date(
    `${value}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}`,
  ).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}
