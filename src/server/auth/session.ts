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
import { canImpersonateAccount } from "#/lib/auth/impersonation-policy";
import { hasApiPermission } from "#/server/auth/permissions";
import {
  isSessionExpired,
  parseStoredPermissions,
  serializeStoredPermissions,
} from "#/server/auth/session-storage";
import { getCloudflareEnv } from "#/server/cloudflare";
import { getDb } from "#/server/db/client";
import {
  authAccounts,
  credentialLoginAttempts,
  webImpersonationEvents,
  webSessions,
} from "#/server/db/schema";

export { hasApiPermission } from "#/server/auth/permissions";

const sessionTtlSeconds = 60 * 60 * 24 * 7;
const betterAuthCookieNames = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "better-auth.session_data",
  "__Secure-better-auth.session_data",
  "better-auth.dont_remember",
  "__Secure-better-auth.dont_remember",
];

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
  impersonation?: {
    actor: {
      uuid: string;
      externalId: string;
      name: string;
    };
    startedAt: string;
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

type ImpersonationResult =
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
  const token = getCookie("bfl_session");

  await logoutDiscordSession();

  if (token) {
    const db = optionalDb();

    if (db) {
      await db.delete(webSessions).where(eq(webSessions.tokenHash, await hashToken(token)));
    }
  }

  deleteCookie("bfl_session", { path: "/" });
}

export async function startImpersonation(accountUuid: string): Promise<ImpersonationResult> {
  const actorSession = await getCurrentSession();

  if (!actorSession) {
    return { ok: false, message: "Entre para visualizar outra conta." };
  }

  if (actorSession.impersonation) {
    return { ok: false, message: "Saia da visualização atual antes de iniciar outra." };
  }

  if (!hasApiPermission(actorSession, "account:impersonate")) {
    return { ok: false, message: "Você não tem permissão para visualizar outra conta." };
  }

  if (actorSession.account.uuid === accountUuid) {
    return { ok: false, message: "Você já está nessa conta." };
  }

  const targetAccount = await getAccountByUuid(accountUuid);

  if (!targetAccount) {
    return { ok: false, message: "Conta não encontrada." };
  }

  if (!canImpersonateAccount({ actor: actorSession.account, target: targetAccount })) {
    return { ok: false, message: "Essa conta tem permissões que você não pode assumir." };
  }

  const db = optionalDb();

  if (!db) {
    return { ok: false, message: "Sessões web não estão disponíveis." };
  }

  const now = new Date();
  const token = getCookie("bfl_session") ?? randomToken();
  const tokenHash = await hashToken(token);
  const existingSession = await findWebSessionByTokenHash(tokenHash);
  const expiresAt =
    existingSession?.expiresAt ?? new Date(now.getTime() + sessionTtlSeconds * 1000);

  if (existingSession) {
    await db
      .update(webSessions)
      .set({
        apiAccountUuid: targetAccount.uuid,
        apiAccountExternalId: targetAccount.externalId,
        apiAccountName: targetAccount.name,
        apiPermissions: serializeStoredPermissions(targetAccount.role.permissions),
        apiBypassAllPermissions: targetAccount.role.bypassAllPermissions,
        impersonatedByAccountUuid: actorSession.account.uuid,
        impersonatedByAccountExternalId: actorSession.account.externalId,
        impersonatedByAccountName: actorSession.account.name,
        impersonationStartedAt: now,
        updatedAt: now,
      })
      .where(eq(webSessions.id, existingSession.id));
  } else {
    await db.insert(webSessions).values({
      id: crypto.randomUUID(),
      tokenHash,
      apiAccountUuid: targetAccount.uuid,
      apiAccountExternalId: targetAccount.externalId,
      apiAccountName: targetAccount.name,
      apiPermissions: serializeStoredPermissions(targetAccount.role.permissions),
      apiBypassAllPermissions: targetAccount.role.bypassAllPermissions,
      impersonatedByAccountUuid: actorSession.account.uuid,
      impersonatedByAccountExternalId: actorSession.account.externalId,
      impersonatedByAccountName: actorSession.account.name,
      impersonationStartedAt: now,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  setCookie("bfl_session", token, {
    httpOnly: true,
    maxAge: Math.max(1, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)),
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(),
  });

  await recordImpersonationEvent({
    kind: "start",
    actor: actorSession.account,
    target: targetAccount,
  });

  return { ok: true };
}

export async function stopImpersonation(): Promise<ImpersonationResult> {
  const token = getCookie("bfl_session");
  const db = optionalDb();

  if (!token || !db) {
    return { ok: false, message: "Nenhuma visualização ativa." };
  }

  const session = await findWebSessionByTokenHash(await hashToken(token));

  if (!session?.impersonatedByAccountUuid) {
    return { ok: false, message: "Nenhuma visualização ativa." };
  }

  const actorAccount = await getAccountByUuid(session.impersonatedByAccountUuid);

  if (!actorAccount) {
    await db.delete(webSessions).where(eq(webSessions.id, session.id));
    deleteCookie("bfl_session", { path: "/" });

    return {
      ok: false,
      message: "A conta original não existe mais. Entre novamente.",
    };
  }

  await db
    .update(webSessions)
    .set({
      apiAccountUuid: actorAccount.uuid,
      apiAccountExternalId: actorAccount.externalId,
      apiAccountName: actorAccount.name,
      apiPermissions: serializeStoredPermissions(actorAccount.role.permissions),
      apiBypassAllPermissions: actorAccount.role.bypassAllPermissions,
      impersonatedByAccountUuid: null,
      impersonatedByAccountExternalId: null,
      impersonatedByAccountName: null,
      impersonationStartedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(webSessions.id, session.id));

  await recordImpersonationEvent({
    kind: "stop",
    actor: actorAccount,
    target: {
      uuid: session.apiAccountUuid,
      externalId: session.apiAccountExternalId,
      name: session.apiAccountName,
    },
  });

  return { ok: true };
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

export async function requireAnyApiPermission(permissions: string[]): Promise<ApiAccountSession> {
  const session = await getCurrentSession();

  if (!session) {
    throw redirect({ to: "/account/login" });
  }

  if (!permissions.some((permission) => hasApiPermission(session, permission))) {
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

  setCookie("bfl_session", token, {
    httpOnly: true,
    maxAge: sessionTtlSeconds,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(),
  });
}

async function getCredentialSession(): Promise<ApiAccountSession | null> {
  const token = getCookie("bfl_session");
  const db = optionalDb();

  if (!token || !db) {
    return null;
  }

  const session = await findWebSessionByTokenHash(await hashToken(token));

  if (!session) {
    return null;
  }

  if (isSessionExpired(session.expiresAt)) {
    await db.delete(webSessions).where(eq(webSessions.id, session.id));
    deleteCookie("bfl_session", { path: "/" });

    return null;
  }

  const impersonation = session.impersonatedByAccountUuid
    ? {
        actor: {
          uuid: session.impersonatedByAccountUuid,
          externalId: session.impersonatedByAccountExternalId ?? "",
          name: session.impersonatedByAccountName ?? "Conta original",
        },
        startedAt: serializeSessionDate(session.impersonationStartedAt ?? session.updatedAt),
      }
    : undefined;
  const account = await getAccountByUuid(session.apiAccountUuid);

  if (account) {
    if (impersonation) {
      const actorAccount = await getAccountByUuid(impersonation.actor.uuid);

      if (!actorAccount || !canImpersonateAccount({ actor: actorAccount, target: account })) {
        await db.delete(webSessions).where(eq(webSessions.id, session.id));
        deleteCookie("bfl_session", { path: "/" });

        return null;
      }
    }

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

    return accountSession("credentials", account, impersonation);
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
    impersonation,
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

async function logoutDiscordSession(): Promise<void> {
  const env = getCloudflareEnv();

  if (!env?.DB) {
    return;
  }

  const auth = createAuth(env.DB);

  await auth.api.signOut({
    headers: getRequest().headers,
  });

  for (const cookieName of betterAuthCookieNames) {
    deleteCookie(cookieName, {
      path: "/",
      secure: cookieName.startsWith("__Secure-"),
    });
  }
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

function accountSession(
  source: ApiAccountSession["source"],
  account: Account,
  impersonation?: ApiAccountSession["impersonation"],
): ApiAccountSession {
  return {
    source,
    account: {
      uuid: account.uuid,
      externalId: account.externalId,
      name: account.name,
      role: {
        title: account.role.title.label,
        permissions: account.role.permissions,
        bypassAllPermissions: account.role.bypassAllPermissions,
      },
    },
    impersonation,
  };
}

async function findWebSessionByTokenHash(tokenHash: string) {
  const db = optionalDb();

  if (!db) {
    return null;
  }

  const [session] = await db
    .select()
    .from(webSessions)
    .where(eq(webSessions.tokenHash, tokenHash))
    .limit(1);

  return session ?? null;
}

async function recordImpersonationEvent(input: {
  kind: "start" | "stop";
  actor: Pick<Account, "uuid" | "externalId" | "name">;
  target: Pick<Account, "uuid" | "externalId" | "name">;
}): Promise<void> {
  const db = optionalDb();

  if (!db) {
    return;
  }

  try {
    await db.insert(webImpersonationEvents).values({
      id: crypto.randomUUID(),
      kind: input.kind,
      actorAccountUuid: input.actor.uuid,
      actorAccountExternalId: input.actor.externalId,
      actorAccountName: input.actor.name,
      targetAccountUuid: input.target.uuid,
      targetAccountExternalId: input.target.externalId,
      targetAccountName: input.target.name,
      requestHash: await hashToken(
        `${getRequestHeader("x-forwarded-for") ?? "local"}:${getRequestHeader("user-agent") ?? ""}`,
      ),
      createdAt: new Date(),
    });
  } catch (error) {
    console.warn("Failed to record impersonation event.", error);
  }
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

function serializeSessionDate(value: Date | null | undefined): string {
  const timestamp = value?.getTime();

  return typeof timestamp === "number" && !Number.isNaN(timestamp)
    ? new Date(timestamp).toISOString()
    : new Date().toISOString();
}
