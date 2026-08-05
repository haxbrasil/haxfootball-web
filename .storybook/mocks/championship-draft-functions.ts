async function unavailableInStorybook(): Promise<never> {
  throw new Error("Draft mutations are not available in static stories.");
}

export const acceptChampionshipTradeFn = unavailableInStorybook;
export const cancelChampionshipTradeFn = unavailableInStorybook;
export const cancelChampionshipDraftFn = unavailableInStorybook;
export const configureChampionshipDraftFn = unavailableInStorybook;
export const createChampionshipTradeFn = unavailableInStorybook;
export const endChampionshipDraftFn = unavailableInStorybook;
export const getChampionshipDraftFn = unavailableInStorybook;
export const getChampionshipTradesFn = unavailableInStorybook;
export const makeChampionshipDraftPickFn = unavailableInStorybook;
export const previewChampionshipDraftCorrectionFn = unavailableInStorybook;
export const previewChampionshipRecordedDraftFn = unavailableInStorybook;
export const recordChampionshipDraftFn = unavailableInStorybook;
export const rejectChampionshipTradeFn = unavailableInStorybook;
export const reverseChampionshipDraftPickFn = unavailableInStorybook;
export const startChampionshipDraftFn = unavailableInStorybook;
