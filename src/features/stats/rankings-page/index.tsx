import { PageHeader } from "#/components/ds/app-shell";
import type { WebQueryMatchMetricsResponse } from "#/server/api/haxfootball";
import { StatsFilterForm } from "./components/stats-filter-form";
import { StatsResultsTable } from "./components/stats-results-table";
import { useStatsQueryForm } from "./hooks/use-stats-query-form";

export function StatsPage({ stats }: { stats: WebQueryMatchMetricsResponse | null }) {
  const form = useStatsQueryForm(stats);

  return (
    <>
      <PageHeader
        title="Stats"
        description="Rankings gerados pelo endpoint genérico de métricas de partidas."
      />

      <StatsFilterForm
        formState={form.formState}
        metricColumns={form.metricColumns}
        isLoading={form.isLoading}
        onSubmit={form.submit}
        onChange={form.updateFormState}
      />

      <StatsResultsTable stats={form.currentStats} />
    </>
  );
}
