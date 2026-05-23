import type { StatsQuery } from "#/server/api/haxfootball";

export type PubRankingFilters = Required<Pick<StatsQuery, "groupBy" | "status">>;

export const defaultPubRankingFilters: PubRankingFilters = {
  groupBy: "account",
  status: "all",
};
