import { createRootRoute, Outlet } from "@tanstack/react-router";
import { SessionAwareAppShell } from "#/components/ds/app-shell/session-aware-app-shell";
import { RootDocument } from "#/components/ds/root-document";
import { getCurrentSessionFn } from "#/server/auth/functions";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  loader: () => getCurrentSessionFn(),
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "BFL | Brazilian HaxFootball League",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/brand/bfl-logo.png",
      },
    ],
  }),
  component: RootLayout,
  shellComponent: RootDocument,
});

function RootLayout() {
  const session = Route.useLoaderData();

  return (
    <SessionAwareAppShell initialSession={session}>
      <Outlet />
    </SessionAwareAppShell>
  );
}
