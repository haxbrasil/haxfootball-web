import "@tanstack/react-start/server-only";

import { getCloudflareEnv } from "#/server/cloudflare";

export async function cachedJson<T>(
  key: string,
  expirationTtl: number,
  load: () => Promise<T>,
): Promise<T> {
  const cache = getCloudflareEnv()?.CACHE;

  if (!cache) {
    return load();
  }

  const cached = await cache.get<T>(key, "json");

  if (cached !== null) {
    return cached;
  }

  const value = await load();
  await cache.put(key, JSON.stringify(value), { expirationTtl });

  return value;
}

export async function deleteCachedJson(key: string): Promise<void> {
  const cache = getCloudflareEnv()?.CACHE;

  if (cache) {
    await cache.delete(key);
  }
}
