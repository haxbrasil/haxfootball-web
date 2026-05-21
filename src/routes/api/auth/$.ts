import { createFileRoute } from "@tanstack/react-router";
import { createAuth } from "#/server/auth/auth";
import { getCloudflareEnv } from "#/server/cloudflare";

async function handleAuthRequest(request: Request): Promise<Response> {
  const database = getCloudflareEnv()?.DB;

  if (!database) {
    return Response.json({ error: "Autenticação indisponível." }, { status: 503 });
  }

  return createAuth(database).handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
});
