import { formatMetricLabel, humanizeStatKey } from "./labels";
import type { StatsMetric } from "./formatting";

const uncategorizedCategoryKey = "__uncategorized";
const uncategorizedCategoryLabel = "Outras";

const categoryLabels: Record<string, string> = {
  defense: "Defesa",
  fantasy: "Fantasy",
  misc: "Outros",
  passing: "Passe",
  receiving: "Recebendo",
  rushing: "Corrida",
  "special-teams": "Times especiais",
};

export type StatsMetricCategoryGroup = {
  category: StatsMetric["category"] | null;
  key: string;
  primaryMetricKey: string | null;
  title: string;
  metrics: StatsMetric[];
};

export type StatsMetricColumn = {
  key: string;
  label: string;
  metric: StatsMetric | null;
};

export type StatsMetricColumnGroup = {
  category: StatsMetric["category"] | null;
  key: string;
  primaryMetricKey: string | null;
  title: string;
  columns: StatsMetricColumn[];
};

export type StatsMetricGroupingOptions = {
  featuredMetricKey?: string | null;
};

export function groupMetricsByCategory(
  metrics: StatsMetric[],
  options: StatsMetricGroupingOptions = {},
): StatsMetricCategoryGroup[] {
  const groups = new Map<string, StatsMetricCategoryGroup>();

  for (const metric of metrics) {
    const category = metric.category ?? null;
    const key = getCategoryKey(category);
    const group =
      groups.get(key) ??
      ({
        category,
        key,
        primaryMetricKey: null,
        title: formatMetricCategoryLabel(category),
        metrics: [],
      } satisfies StatsMetricCategoryGroup);

    group.metrics.push(metric);
    groups.set(key, group);
  }

  return sortFeaturedMetricGroupFirst(
    [...groups.values()].map((group) => ({
      ...group,
      primaryMetricKey: getPrimaryMetricKey(group.category, group.metrics),
    })),
    options.featuredMetricKey,
    (group) => group.metrics,
  );
}

export function groupMetricKeysByCategory(
  metricKeys: string[],
  metricMetadata: StatsMetric[],
  options: StatsMetricGroupingOptions = {},
): StatsMetricColumnGroup[] {
  const visibleMetadata = metricMetadata.filter((metric) => !metric.hidden);
  const metricKeySet = new Set(metricKeys);
  const metadataKeySet = new Set(metricMetadata.map((metric) => metric.key));
  const metadataByKey = new Map(visibleMetadata.map((metric) => [metric.key, metric]));
  const orderedKnownMetrics = visibleMetadata.filter((metric) => metricKeySet.has(metric.key));
  const orderedKnownMetricKeys = new Set(orderedKnownMetrics.map((metric) => metric.key));
  const unknownMetricKeys = metricKeys
    .filter((key) => !orderedKnownMetricKeys.has(key) && !metadataKeySet.has(key))
    .sort((left, right) => left.localeCompare(right));
  const columns = [
    ...orderedKnownMetrics.map((metric) => ({
      key: metric.key,
      label: formatMetricLabel(metric.key, metric.label),
      metric,
    })),
    ...unknownMetricKeys.map((key) => ({
      key,
      label: formatMetricLabel(key),
      metric: metadataByKey.get(key) ?? null,
    })),
  ];

  const groups = new Map<string, StatsMetricColumnGroup>();

  for (const column of columns) {
    const category = column.metric?.category ?? null;
    const key = getCategoryKey(category);
    const group =
      groups.get(key) ??
      ({
        category,
        key,
        primaryMetricKey: null,
        title: formatMetricCategoryLabel(category),
        columns: [],
      } satisfies StatsMetricColumnGroup);

    group.columns.push(column);
    groups.set(key, group);
  }

  return sortFeaturedMetricGroupFirst(
    [...groups.values()].map((group) => ({
      ...group,
      primaryMetricKey: getPrimaryMetricKey(
        group.category,
        group.columns.flatMap((column) => (column.metric ? [column.metric] : [])),
      ),
    })),
    options.featuredMetricKey,
    (group) => group.columns.flatMap((column) => (column.metric ? [column.metric] : [])),
  );
}

function sortFeaturedMetricGroupFirst<TGroup>(
  groups: TGroup[],
  featuredMetricKey: string | null | undefined,
  getMetrics: (group: TGroup) => StatsMetric[],
): TGroup[] {
  if (!featuredMetricKey) {
    return groups;
  }

  const featuredGroupIndex = groups.findIndex((group) =>
    getMetrics(group).some((metric) => metric.key === featuredMetricKey),
  );

  if (featuredGroupIndex <= 0) {
    return groups;
  }

  const nextGroups = [...groups];
  const [featuredGroup] = nextGroups.splice(featuredGroupIndex, 1);

  return featuredGroup ? [featuredGroup, ...nextGroups] : groups;
}

export function formatMetricCategoryLabel(category: StatsMetric["category"] | null | undefined) {
  if (!category) {
    return uncategorizedCategoryLabel;
  }

  const rawLabel = category.label || category.key;
  const normalizedCategoryKey = category.key.replace(/^category\./, "");

  if (categoryLabels[normalizedCategoryKey]) {
    return categoryLabels[normalizedCategoryKey];
  }

  if (rawLabel && !rawLabel.startsWith("category.")) {
    return rawLabel;
  }

  const normalizedKey = rawLabel?.startsWith("category.")
    ? rawLabel.slice("category.".length)
    : normalizedCategoryKey;

  return categoryLabels[normalizedKey] ?? humanizeStatKey(normalizedKey);
}

function getCategoryKey(category: StatsMetric["category"] | null) {
  return category?.key ?? uncategorizedCategoryKey;
}

function getPrimaryMetricKey(category: StatsMetric["category"] | null, metrics: StatsMetric[]) {
  const primaryMetric = category?.primaryMetric;

  if (primaryMetric && metrics.some((metric) => metric.key === primaryMetric)) {
    return primaryMetric;
  }

  return metrics[0]?.key ?? null;
}
