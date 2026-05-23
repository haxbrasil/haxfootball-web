import type { StatsCategoryRanking, StatsCategoryRankingsResponse } from "#/server/api/haxfootball";

export function splitPubPointsRanking(rankings: StatsCategoryRankingsResponse) {
  const pointsMetricKey = findFeaturedPointsMetricKey(rankings.categories);

  if (!pointsMetricKey) {
    return {
      pointsCategory: null,
      pointsMetricKey: null,
      regularCategories: rankings.categories,
    };
  }

  const pointsCategory =
    rankings.categories.find((category) => categoryIncludesMetric(category, pointsMetricKey)) ??
    null;

  return {
    pointsCategory,
    pointsMetricKey,
    regularCategories: pointsCategory
      ? rankings.categories.filter((category) => category.key !== pointsCategory.key)
      : rankings.categories,
  };
}

export function getPubPointsMetric(category: StatsCategoryRanking) {
  const pointsMetricKey = category.stats.meta.featuredMetrics?.points;

  if (!pointsMetricKey) {
    return null;
  }

  return category.metrics.find((metric) => metric.key === pointsMetricKey) ?? null;
}

function findFeaturedPointsMetricKey(categories: StatsCategoryRanking[]) {
  for (const category of categories) {
    const pointsMetricKey = category.stats.meta.featuredMetrics?.points;

    if (pointsMetricKey && categoryIncludesMetric(category, pointsMetricKey)) {
      return pointsMetricKey;
    }
  }

  return null;
}

function categoryIncludesMetric(category: StatsCategoryRanking, metricKey: string) {
  return (
    category.primaryMetricKey === metricKey ||
    category.metricKeys.includes(metricKey) ||
    category.metrics.some((metric) => metric.key === metricKey)
  );
}
