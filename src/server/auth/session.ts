import "@tanstack/react-start/server-only";

import type { Account } from "@haxbrasil/haxfootball-api-sdk";
import { redirect } from "@tanstack/react-router";
import {
  deleteCookie,
  getCookie,
  getRequest,
  getRequestHeader,
  setCookie,
} from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import {
  confirmAccountCredentials,
  getAccountByExternalId,
  getAccountByName,
  getAccountByUuid,
} from "#/server/api/haxfootball";
import { createAuth } from "#/server/auth/auth";
import { hasApiPermission } from "#/server/auth/permissions";
import {
  isSessionExpired,
  parseStoredPermissions,
  serializeStoredPermissions,
} from "#/server/auth/session-storage";
import { getCloudflareEnv } from "#/server/cloudflare";
import { getDb } from "#/server/db/client";
import { authAccounts, credentialLoginAttempts, webSessions } from "#/server/db/schema";

export { hasApiPermission } from "#/server/auth/permissions";

const sessionCookieName = "bfl_session";
const sessionTtlSeconds = 60 * 60 * 24 * 7;

export type ApiAccountSession = {
  source: "credentials" | "discord";
  account: {
    uuid: string;
    externalId: string;
    name: string;
    role: {
      title: string;
      permissions: string[];
      bypassAllPermissions: boolean;
    };
  };
};

type LoginResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export async function loginWithCredentials(input: {
  name: string;
  password: string;
}): Promise<LoginResult> {
  const name = input.name.trim();

  if (!name || !input.password) {
    return { ok: false, message: "Informe conta e senha." };
  }

  const confirmation = await confirmAccountCredentials({
    name,
    password: input.password,
  });
  const succeeded = confirmation?.valid === true;

  await recordCredentialLoginAttempt(name, succeeded);

  if (!succeeded) {
    return { ok: false, message: "Conta ou senha inválidas." };
  }

  const account = await getAccountByName(name);

  if (!account) {
    return { ok: false, message: "Conta validada, mas não encontrada." };
  }

  await createCredentialSession(account);

  return { ok: true };
}

export async function logoutCurrentSession(): Promise<void> {
  const token = getCookie(sessionCookieName);

  if (token) {
    const db = optionalDb();

    if (db) {
      await db.delete(webSessions).where(eq(webSessions.tokenHash, await hashToken(token)));
    }
  }

  deleteCookie(sessionCookieName, { path: "/" });
}

export async function getCurrentSession(): Promise<ApiAccountSession | null> {
  return (await getCredentialSession()) ?? (await getDiscordSession());
}

export async function requireApiPermission(permission: string): Promise<ApiAccountSession> {
  const session = await getCurrentSession();

  if (!session) {
    throw redirect({ to: "/account/login" });
  }

  if (!hasApiPermission(session, permission)) {
    throw new Response("Não autorizado.", { status: 403 });
  }

  return session;
}

async function createCredentialSession(account: Account): Promise<void> {
  const db = getDb();
  const now = new Date();
  const token = randomToken();

  await db.insert(webSessions).values({
    id: crypto.randomUUID(),
    tokenHash: await hashToken(token),
    apiAccountUuid: account.uuid,
    apiAccountExternalId: account.externalId,
    apiAccountName: account.name,
    apiPermissions: serializeStoredPermissions(account.role.permissions),
    apiBypassAllPermissions: account.role.bypassAllPermissions,
    expiresAt: new Date(now.getTime() + sessionTtlSeconds * 1000),
    createdAt: now,
    updatedAt: now,
  });

  setCookie(sessionCookieName, token, {
    httpOnly: true,
    maxAge: sessionTtlSeconds,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(),
  });
}

async function getCredentialSession(): Promise<ApiAccountSession | null> {
  const token = getCookie(sessionCookieName);
  const db = optionalDb();

  if (!token || !db) {
    return null;
  }

  const [session] = await db
    .select()
    .from(webSessions)
    .where(eq(webSessions.tokenHash, await hashToken(token)))
    .limit(1);

  if (!session) {
    return null;
  }

  if (isSessionExpired(session.expiresAt)) {
    await db.delete(webSessions).where(eq(webSessions.id, session.id));
    deleteCookie(sessionCookieName, { path: "/" });

    return null;
  }

  const account = await getAccountByUuid(session.apiAccountUuid);

  if (account) {
    await db
      .update(webSessions)
      .set({
        apiAccountExternalId: account.externalId,
        apiAccountName: account.name,
        apiPermissions: serializeStoredPermissions(account.role.permissions),
        apiBypassAllPermissions: account.role.bypassAllPermissions,
        updatedAt: new Date(),
      })
      .where(eq(webSessions.id, session.id));

    return accountSession("credentials", account);
  }

  return {
    source: "credentials",
    account: {
      uuid: session.apiAccountUuid,
      externalId: session.apiAccountExternalId,
      name: session.apiAccountName,
      role: {
        title: "Conta",
        permissions: parseStoredPermissions(session.apiPermissions),
        bypassAllPermissions: session.apiBypassAllPermissions,
      },
    },
  };
}

async function getDiscordSession(): Promise<ApiAccountSession | null> {
  const env = getCloudflareEnv();
  const db = optionalDb();

  if (!env?.DB || !db) {
    return null;
  }

  const auth = createAuth(env.DB);
  const session = await auth.api.getSession({
    headers: getRequest().headers,
  });

  if (!session) {
    return null;
  }

  const [discordAccount] = await db
    .select()
    .from(authAccounts)
    .where(eq(authAccounts.userId, session.user.id))
    .limit(1);

  if (!discordAccount || discordAccount.providerId !== "discord") {
    return null;
  }

  const account = await getAccountByExternalId(discordAccount.accountId);

  return account ? accountSession("discord", account) : null;
}

async function recordCredentialLoginAttempt(
  accountName: string,
  succeeded: boolean,
): Promise<void> {
  const db = optionalDb();

  if (!db) {
    return;
  }

  try {
    await db.insert(credentialLoginAttempts).values({
      id: crypto.randomUUID(),
      accountName,
      ipHash: await hashToken(`${getRequestHeader("x-forwarded-for") ?? "local"}:${accountName}`),
      attemptedAt: new Date(),
      succeeded,
    });
  } catch (error) {
    console.warn("Failed to record credential login attempt.", error);
  }
}

function accountSession(source: ApiAccountSession["source"], account: Account): ApiAccountSession {
  return {
    source,
    account: {
      uuid: account.uuid,
      externalId: account.externalId,
      name: account.name,
      role: {
        title: account.role.title,
        permissions: account.role.permissions,
        bypassAllPermissions: account.role.bypassAllPermissions,
      },
    },
  };
}

function optionalDb(): ReturnType<typeof getDb> | null {
  try {
    return getDb();
  } catch {
    return null;
  }
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return base64Url(bytes);
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));

  return base64Url(new Uint8Array(digest));
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function isSecureRequest(): boolean {
  const request = getRequest();

  return new URL(request.url).protocol === "https:";
}
