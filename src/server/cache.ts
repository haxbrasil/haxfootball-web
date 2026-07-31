import "@tanstack/react-start/server-only";

import { getCloudflareEnv } from "#/server/cloudflare";

const minimumKvExpirationTtl = 60;

export async function cachedJson<T>(
  key: string,
  expirationTtl: number,
  load: () => Promise<T>,
): Promise<T> {
  const cache = getCloudflareEnv()?.CACHE;

  if (!cache) {
    return load();
  }

  let cached: T | null = null;

  try {
    cached = await cache.get<T>(key, "json");
  } catch (error) {
    console.warn("KV cache read failed; loading from the source instead.", error);
  }

  if (cached !== null) {
    return cached;
  }

  const value = await load();
  try {
    await cache.put(key, JSON.stringify(value), {
      expirationTtl: Math.max(expirationTtl, minimumKvExpirationTtl),
    });
  } catch (error) {
    console.warn("KV cache write failed; returning the source value.", error);
  }

  return value;
}

export async function deleteCachedJson(key: string): Promise<void> {
  const cache = getCloudflareEnv()?.CACHE;

  if (cache) {
    try {
      await cache.delete(key);
    } catch (error) {
      console.warn("KV cache invalidation failed; continuing without it.", error);
    }
  }
}
