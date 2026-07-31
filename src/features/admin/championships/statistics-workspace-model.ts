import type {
  ChampionshipMetricMappingsData,
  ChampionshipStatisticsData,
} from "#/server/api/championship-api";

export type StatisticsProjection = ChampionshipStatisticsData;
export type MetricMappingsProjection = ChampionshipMetricMappingsData;
export type MetricSource = StatisticsProjection["metricSources"]["items"][number];
export type MetricMappingDraft = {
  sourceKey: string;
  enabled: boolean;
  eventSchemaId: string;
  eventSchemaName: string;
  eventSchemaVersion: number;
  sourceMetricKey: string;
  canonicalMetricKey: string;
  displayLabel: string;
  valueKind: "integer" | "number" | "duration" | "percentage";
  aggregation: "sum" | "average" | "maximum" | "minimum";
};

const reservedMetricKeys = new Set(["matches_played", "playing_time_seconds"]);

export function playerMetricColumns(statistics: StatisticsProjection): string[] {
  return [
    ...new Set(
      statistics.players.items.flatMap((player) =>
        Object.keys(player.metrics).filter((key) => !reservedMetricKeys.has(key)),
      ),
    ),
  ].sort((left, right) => left.localeCompare(right, "pt-BR"));
}

export function metricMappingDrafts(
  statistics: StatisticsProjection,
  mappings: MetricMappingsProjection,
): MetricMappingDraft[] {
  const sourceByKey = new Map(
    statistics.metricSources.items.map((source) => [metricSourceKey(source), source]),
  );

  for (const mapping of mappings.items) {
    const key = `${mapping.source.eventSchemaId}:${mapping.source.eventSchemaVersion}:${mapping.source.metricKey}`;
    if (!sourceByKey.has(key)) {
      sourceByKey.set(key, {
        eventSchemaId: mapping.source.eventSchemaId,
        eventSchemaName: mapping.source.eventSchemaName,
        eventSchemaVersion: mapping.source.eventSchemaVersion,
        metricKey: mapping.source.metricKey,
        label: mapping.displayLabel,
        valueKind: mapping.valueKind,
        mappedCanonicalMetricKey: mapping.canonicalMetricKey,
      });
    }
  }

  return [...sourceByKey.values()]
    .map((source) => {
      const existing = mappings.items.find(
        (mapping) =>
          mapping.source.eventSchemaId === source.eventSchemaId &&
          Number(mapping.source.eventSchemaVersion) === Number(source.eventSchemaVersion) &&
          mapping.source.metricKey === source.metricKey,
      );

      return {
        sourceKey: metricSourceKey(source),
        enabled: Boolean(existing),
        eventSchemaId: source.eventSchemaId,
        eventSchemaName: source.eventSchemaName,
        eventSchemaVersion: Number(source.eventSchemaVersion),
        sourceMetricKey: source.metricKey,
        canonicalMetricKey: existing?.canonicalMetricKey ?? source.metricKey,
        displayLabel: existing?.displayLabel ?? source.label ?? humanizeMetricKey(source.metricKey),
        valueKind: existing?.valueKind ?? source.valueKind,
        aggregation: existing?.aggregation ?? "sum",
      };
    })
    .sort(
      (left, right) =>
        left.canonicalMetricKey.localeCompare(right.canonicalMetricKey, "pt-BR") ||
        left.eventSchemaName.localeCompare(right.eventSchemaName, "pt-BR") ||
        left.eventSchemaVersion - right.eventSchemaVersion,
    );
}

export function validateMetricMappingDrafts(drafts: MetricMappingDraft[]): string[] {
  const issues: string[] = [];
  const sources = new Set<string>();
  const canonical = new Map<
    string,
    Pick<MetricMappingDraft, "displayLabel" | "valueKind" | "aggregation">
  >();

  for (const draft of drafts.filter((item) => item.enabled)) {
    if (!draft.canonicalMetricKey.trim()) {
      issues.push(`A métrica ${draft.sourceMetricKey} precisa de uma chave canônica.`);
    }
    if (!draft.displayLabel.trim()) {
      issues.push(`A métrica ${draft.sourceMetricKey} precisa de um nome público.`);
    }
    if (sources.has(draft.sourceKey)) {
      issues.push(`A origem ${draft.sourceKey} está duplicada.`);
    }
    sources.add(draft.sourceKey);

    const key = draft.canonicalMetricKey.trim();
    const definition = {
      displayLabel: draft.displayLabel.trim(),
      valueKind: draft.valueKind,
      aggregation: draft.aggregation,
    };
    const previous = canonical.get(key);

    if (
      previous &&
      (previous.displayLabel !== definition.displayLabel ||
        previous.valueKind !== definition.valueKind ||
        previous.aggregation !== definition.aggregation)
    ) {
      issues.push(`As definições da métrica canônica ${key} não são iguais.`);
    } else {
      canonical.set(key, definition);
    }
  }

  return [...new Set(issues)];
}

export function metricSourceKey(
  source: Pick<MetricSource, "eventSchemaId" | "eventSchemaVersion" | "metricKey">,
): string {
  return `${source.eventSchemaId}:${source.eventSchemaVersion}:${source.metricKey}`;
}

export function humanizeMetricKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

export function statisticValueLabel(
  value: number,
  kind: "integer" | "number" | "duration" | "percentage" = "number",
): string {
  if (kind === "duration") {
    const rounded = Math.max(0, Math.round(value));
    const hours = Math.floor(rounded / 3600);
    const minutes = Math.floor((rounded % 3600) / 60);
    const seconds = rounded % 60;
    return hours > 0
      ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  if (kind === "percentage") {
    return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value * 100)}%`;
  }
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: kind === "integer" ? 0 : 2,
  }).format(value);
}
