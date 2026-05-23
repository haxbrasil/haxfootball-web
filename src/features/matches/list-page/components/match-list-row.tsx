import type { ListMatchesResponse } from "@haxbrasil/haxfootball-api-sdk";
import { MatchSummaryLink } from "#/components/ds/match-summary-link";

export function MatchListRow({ match }: { match: ListMatchesResponse["items"][number] }) {
  return <MatchSummaryLink match={match} />;
}
