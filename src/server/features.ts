import "@tanstack/react-start/server-only";

import { getServerEnv } from "#/server/env";

export type ProductFeatures = {
  championships: boolean;
};

export function getProductFeatures(): ProductFeatures {
  return {
    championships: getServerEnv().CHAMPIONSHIPS_ENABLED,
  };
}
