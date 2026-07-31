async function unavailableInStorybook(): Promise<never> {
  throw new Error("Match mutations are not available in static stories.");
}

export const attachChampionshipMatchEvidenceFn = unavailableInStorybook;
export const detachChampionshipMatchEvidenceFn = unavailableInStorybook;
export const getChampionshipMatchOperationsFn = unavailableInStorybook;
export const getChampionshipStatisticsFn = unavailableInStorybook;
export const listChampionshipEvidenceCandidatesFn = unavailableInStorybook;
export const listChampionshipMetricMappingsFn = unavailableInStorybook;
export const previewChampionshipMatchSettlementFn = unavailableInStorybook;
export const replaceChampionshipMetricMappingsFn = unavailableInStorybook;
export const settleChampionshipMatchFn = unavailableInStorybook;
export const updateChampionshipMatchAttributionsFn = unavailableInStorybook;
