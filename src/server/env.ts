import "@tanstack/react-start/server-only";

import { z } from "zod";
import { getCloudflareEnv } from "#/server/cloudflare";

const serverEnvSchema = z.object({
  API_BASE_URL: z.string().url().optional(),
  API_KEY: z.string().min(1).optional(),
  APP_BASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  DISCORD_CLIENT_ID: z.string().min(1).optional(),
  DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
  STAT_SCHEMA_NAME: z.string().min(1).default("haxfootball"),
  LANGUAGE: z.string().min(2).default("pt"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const source = {
    ...(globalThis.process?.env ?? {}),
    ...(getCloudflareEnv() ?? {}),
  };

  return serverEnvSchema.parse(source);
}
