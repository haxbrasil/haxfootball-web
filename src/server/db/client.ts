import "@tanstack/react-start/server-only";

import { drizzle } from "drizzle-orm/d1";
import { getCloudflareEnv } from "#/server/cloudflare";
import * as schema from "#/server/db/schema";

export function getDb() {
  const database = getCloudflareEnv()?.DB;

  if (!database) {
    throw new Error("D1 binding DB is not available.");
  }

  return drizzle(database, { schema });
}
