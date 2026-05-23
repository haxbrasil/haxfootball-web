import type { ListMatchesResponse, MatchSummary } from "@haxbrasil/haxfootball-api-sdk";
import type { PaginationQuery } from "#/lib/pagination/page";

const defaultAccountMatchesLimit = 8;

export function createAccountMatchPage(
  matches: MatchSummary[],
  query: PaginationQuery = {},
): ListMatchesResponse {
  const limit = query.limit ?? defaultAccountMatchesLimit;
  const offset = parseAccountMatchCursor(query.cursor);
  const items = dedupeMatches(matches).sort(compareMatchesByDateDesc);
  const nextOffset = offset + limit;

  return {
    items: items.slice(offset, nextOffset),
    page: {
      limit,
      nextCursor: nextOffset < items.length ? String(nextOffset) : null,
    },
  };
}

function dedupeMatches(matches: MatchSummary[]) {
  return [...new Map(matches.map((match) => [match.id, match])).values()];
}

function compareMatchesByDateDesc(first: MatchSummary, second: MatchSummary) {
  return getMatchTime(second) - getMatchTime(first);
}

function getMatchTime(match: MatchSummary) {
  return new Date(match.initiatedAt ?? match.endedAt ?? match.createdAt).getTime();
}

function parseAccountMatchCursor(cursor: string | undefined) {
  if (!cursor) {
    return 0;
  }

  const parsedCursor = Number.parseInt(cursor, 10);

  return Number.isFinite(parsedCursor) && parsedCursor > 0 ? parsedCursor : 0;
}
