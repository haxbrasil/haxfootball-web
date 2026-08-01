import type { ChampionshipWorkspaceData } from "#/server/api/championship-api";
import { ChampionshipVisualizationWorkspace } from "./visualization-workspace";

export function StatisticsWorkspace({
  data,
}: {
  data: Pick<ChampionshipWorkspaceData, "championship">;
}) {
  return (
    <div className="space-y-5">
      <ChampionshipVisualizationWorkspace championshipId={data.championship.uuid} />
    </div>
  );
}
