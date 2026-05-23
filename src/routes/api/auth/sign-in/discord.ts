import { createFileRoute } from "@tanstack/react-router";
import { createAuth } from "#/server/auth/auth";
import { getCloudflareEnv } from "#/server/cloudflare";
import { getServerEnv } from "#/server/env";

async function handleDiscordSignInRequest(request: Request): Promise<Response> {
  const database = getCloudflareEnv()?.DB;

  if (!database) {
    return Response.json({ error: "Autenticação indisponível." }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const appBaseUrl = getServerEnv().APP_BASE_URL ?? requestUrl.origin;
  const signInUrl = new URL("/api/auth/sign-in/social", request.url);
  const headers = new Headers(request.headers);

  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");

  const signInResponse = await createAuth(database).handler(
    new Request(signInUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        provider: "discord",
        callbackURL: `${appBaseUrl}/account`,
        errorCallbackURL: `${appBaseUrl}/account/login`,
      }),
    }),
  );
  const signInResult = (await signInResponse.json()) as {
    url?: string;
  };

  if (!signInResult.url) {
    return Response.json({ error: "Login com Discord indisponível." }, { status: 503 });
  }

  const redirectResponse = Response.redirect(signInResult.url, 302);

  copyAuthCookies(signInResponse.headers, redirectResponse.headers);

  return redirectResponse;
}

function copyAuthCookies(source: Headers, target: Headers): void {
  const cookies = (
    source as Headers & {
      getSetCookie?: () => string[];
    }
  ).getSetCookie?.();

  if (cookies) {
    for (const cookie of cookies) {
      target.append("set-cookie", cookie);
    }

    return;
  }

  const cookie = source.get("set-cookie");

  if (cookie) {
    target.append("set-cookie", cookie);
  }
}

export const Route = createFileRoute("/api/auth/sign-in/discord")({
  server: {
    handlers: {
      GET: ({ request }) => handleDiscordSignInRequest(request),
    },
  },
});
