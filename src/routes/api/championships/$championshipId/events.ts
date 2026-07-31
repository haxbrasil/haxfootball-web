import { createFileRoute } from "@tanstack/react-router";
import { hasApiPermission } from "#/server/auth/permissions";
import { getCurrentSession } from "#/server/auth/session";
import { getApiClient } from "#/server/api/haxfootball";

async function proxyChampionshipEvents(
  request: Request,
  championshipId: string,
): Promise<Response> {
  const session = await getCurrentSession();

  if (
    !session ||
    !["championship:admin", "championship:operate"].some((permission) =>
      hasApiPermission(session, permission),
    )
  ) {
    return new Response("Não autorizado.", { status: 401 });
  }

  const client = getApiClient();

  if (!client) {
    return new Response("API indisponível.", { status: 503 });
  }

  const lastEventId = parseSequence(request.headers.get("last-event-id"));
  const result = await client.championships.events.open(
    championshipId,
    {
      actorAccountUuid: session.account.uuid,
      ...(lastEventId === undefined ? {} : { afterSequence: lastEventId }),
    },
    {
      ...(lastEventId === undefined ? {} : { lastEventId }),
      signal: request.signal,
    },
  );

  if (!result.ok) {
    return Response.json(
      { error: result.error.message },
      { status: result.error.kind === "api" ? result.error.status : 502 },
    );
  }

  const upstream = result.data;
  const headers = new Headers();

  headers.set("content-type", upstream.headers.get("content-type") ?? "text/event-stream");
  headers.set("cache-control", "no-cache, no-transform");
  headers.set("x-accel-buffering", "no");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

function parseSequence(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return undefined;

  const sequence = Number(value);
  return Number.isSafeInteger(sequence) ? sequence : undefined;
}

export const Route = createFileRoute("/api/championships/$championshipId/events")({
  server: {
    handlers: {
      GET: ({ request, params }) => proxyChampionshipEvents(request, params.championshipId),
    },
  },
});
