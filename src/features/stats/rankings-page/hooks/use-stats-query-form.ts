import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { visibleMetricColumns } from "#/lib/stats-metrics/formatting";
import type { StatsQuery, WebQueryMatchMetricsResponse } from "#/server/api/haxfootball";
import { queryStatsFn } from "#/server/api/functions";

export type StatsFormState = Required<
  Pick<StatsQuery, "groupBy" | "sortKey" | "sortType" | "direction" | "limit" | "status">
>;

const defaultFormState: StatsFormState = {
  groupBy: "player",
  sortKey: "name",
  sortType: "field",
  direction: "asc",
  limit: 25,
  status: "all",
};

export function useStatsQueryForm(initialStats: WebQueryMatchMetricsResponse | null) {
  const queryStats = useServerFn(queryStatsFn);
  const [currentStats, setCurrentStats] = useState(initialStats);
  const [formState, setFormState] = useState<StatsFormState>(defaultFormState);
  const [isLoading, setIsLoading] = useState(false);
  const metricColumns = useMemo(() => visibleMetricColumns(currentStats), [currentStats]);

  function updateFormState<TField extends keyof StatsFormState>(
    field: TField,
    value: StatsFormState[TField],
  ) {
    setFormState((state) => ({
      ...state,
      [field]: value,
      sortType: field === "sortKey" && value !== "name" ? "metric" : state.sortType,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const nextStats = await queryStats({
      data: {
        ...formState,
        sortType: formState.sortKey === "name" ? "field" : "metric",
      },
    });

    setCurrentStats(nextStats);
    setIsLoading(false);
  }

  return {
    currentStats,
    formState,
    isLoading,
    metricColumns,
    submit,
    updateFormState,
  };
}
