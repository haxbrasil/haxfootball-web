import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCloudflareEnv } from "#/server/cloudflare";
import { cachedJson, deleteCachedJson } from "./cache";

vi.mock("#/server/cloudflare", () => ({ getCloudflareEnv: vi.fn() }));

const mockedEnv = vi.mocked(getCloudflareEnv);

describe("KV cache resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("returns the source value when the daily KV write limit is exhausted", async () => {
    mockedEnv.mockReturnValue({
      CACHE: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockRejectedValue(new Error("KV put() limit exceeded for the day.")),
      } as unknown as KVNamespace,
    });

    await expect(cachedJson("public:rooms", 15, async () => ["room"])).resolves.toEqual(["room"]);
  });

  it("loads from the source when KV reads fail", async () => {
    mockedEnv.mockReturnValue({
      CACHE: {
        get: vi.fn().mockRejectedValue(new Error("KV unavailable")),
        put: vi.fn().mockResolvedValue(undefined),
      } as unknown as KVNamespace,
    });

    await expect(cachedJson("public:matches", 30, async () => ["match"])).resolves.toEqual([
      "match",
    ]);
  });

  it("does not fail a mutation when cache invalidation fails", async () => {
    mockedEnv.mockReturnValue({
      CACHE: {
        delete: vi.fn().mockRejectedValue(new Error("KV unavailable")),
      } as unknown as KVNamespace,
    });

    await expect(deleteCachedJson("public:rooms")).resolves.toBeUndefined();
  });
});
