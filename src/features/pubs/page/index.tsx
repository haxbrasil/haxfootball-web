import type { ListMatchesResponse } from "@haxbrasil/haxfootball-api-sdk";
import type { StatsCategoryRankingsResponse } from "#/server/api/haxfootball";
import { PubGamesPanel } from "./components/pub-games-panel";
import { PubOverview } from "./components/pub-overview";
import { PubRankingsPanel } from "./components/pub-rankings-panel";
import { defaultPubRankingFilters } from "./utils/pub-ranking-filters";

export function PubsPage({
  matches,
  rankings,
}: {
  matches: ListMatchesResponse;
  rankings: StatsCategoryRankingsResponse;
}) {
  return (
    <div className="grid gap-5">
      <PubOverview matches={matches} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <PubGamesPanel matches={matches} />
        <PubRankingsPanel rankings={rankings} initialFilters={defaultPubRankingFilters} />
      </div>
    </div>
  );
}
