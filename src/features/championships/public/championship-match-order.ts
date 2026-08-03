import type { PublicChampionshipDetail } from "#/server/api/championship-api";

type PublicChampionshipMatch = PublicChampionshipDetail["format"]["matches"]["items"][number];
type PublicChampionshipStage = PublicChampionshipDetail["format"]["stages"]["items"][number];

export function sortPublicChampionshipMatches(
  matches: readonly PublicChampionshipMatch[],
  stages: readonly PublicChampionshipStage[],
) {
  const stageOrder = new Map(stages.map((stage) => [stage.uuid, numericValue(stage.displayOrder)]));

  return [...matches].sort((left, right) => {
    const stageComparison = compareNumbers(
      stageOrder.get(left.stageUuid) ?? Number.MAX_SAFE_INTEGER,
      stageOrder.get(right.stageUuid) ?? Number.MAX_SAFE_INTEGER,
    );
    if (stageComparison !== 0) return stageComparison;

    const matchComparison = compareNumbers(
      numericValue(left.displayOrder),
      numericValue(right.displayOrder),
    );
    if (matchComparison !== 0) return matchComparison;

    return left.label.localeCompare(right.label, "pt-BR");
  });
}

function numericValue(value: string | number) {
  const result = Number(value);
  return Number.isFinite(result) ? result : Number.MAX_SAFE_INTEGER;
}

function compareNumbers(left: number, right: number) {
  return left - right;
}
