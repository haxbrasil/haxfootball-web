import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const authAccounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const webAccountLinks = sqliteTable(
  "web_account_links",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    apiAccountUuid: text("api_account_uuid").notNull(),
    apiAccountExternalId: text("api_account_external_id").notNull(),
    apiAccountName: text("api_account_name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("web_account_links_user_id_unique").on(table.userId),
    uniqueIndex("web_account_links_api_account_uuid_unique").on(table.apiAccountUuid),
  ],
);

export const credentialLoginAttempts = sqliteTable("credential_login_attempts", {
  id: text("id").primaryKey(),
  accountName: text("account_name").notNull(),
  ipHash: text("ip_hash").notNull(),
  attemptedAt: integer("attempted_at", { mode: "timestamp" }).notNull(),
  succeeded: integer("succeeded", { mode: "boolean" }).notNull(),
});

export const webImpersonationEvents = sqliteTable("web_impersonation_events", {
  id: text("id").primaryKey(),
  kind: text("kind", { enum: ["start", "stop"] }).notNull(),
  actorAccountUuid: text("actor_account_uuid").notNull(),
  actorAccountExternalId: text("actor_account_external_id").notNull(),
  actorAccountName: text("actor_account_name").notNull(),
  targetAccountUuid: text("target_account_uuid").notNull(),
  targetAccountExternalId: text("target_account_external_id").notNull(),
  targetAccountName: text("target_account_name").notNull(),
  requestHash: text("request_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const webSessions = sqliteTable(
  "web_sessions",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    apiAccountUuid: text("api_account_uuid").notNull(),
    apiAccountExternalId: text("api_account_external_id").notNull(),
    apiAccountName: text("api_account_name").notNull(),
    apiPermissions: text("api_permissions").notNull(),
    apiBypassAllPermissions: integer("api_bypass_all_permissions", { mode: "boolean" })
      .notNull()
      .default(false),
    impersonatedByAccountUuid: text("impersonated_by_account_uuid"),
    impersonatedByAccountExternalId: text("impersonated_by_account_external_id"),
    impersonatedByAccountName: text("impersonated_by_account_name"),
    impersonationStartedAt: integer("impersonation_started_at", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("web_sessions_token_hash_unique").on(table.tokenHash),
    uniqueIndex("web_sessions_user_id_unique").on(table.userId),
  ],
);
