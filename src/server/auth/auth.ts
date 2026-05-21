import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getServerEnv } from "#/server/env";

export function createAuth(database: D1Database) {
  const env = getServerEnv();

  return betterAuth({
    database,
    secret: env.AUTH_SECRET,
    baseURL: env.APP_BASE_URL,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      discord:
        env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
          ? {
              clientId: env.DISCORD_CLIENT_ID,
              clientSecret: env.DISCORD_CLIENT_SECRET,
            }
          : undefined,
    },
    plugins: [tanstackStartCookies()],
  });
}
