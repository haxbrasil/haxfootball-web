import "@tanstack/react-start/server-only";

import { AsyncLocalStorage } from "node:async_hooks";

export type CloudflareBindings = {
  DB?: D1Database;
  CACHE?: KVNamespace;
  API_BASE_URL?: string;
  API_KEY?: string;
  APP_BASE_URL?: string;
  AUTH_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  STAT_SCHEMA_NAME?: string;
  LANGUAGE?: string;
};

const storage = new AsyncLocalStorage<CloudflareBindings>();

export function runWithCloudflareEnv<T>(env: CloudflareBindings, callback: () => T): T {
  return storage.run(env, callback);
}

export function getCloudflareEnv(): CloudflareBindings | null {
  return storage.getStore() ?? null;
}
