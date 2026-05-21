import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "#/features/account/account-page";
import { getCurrentSessionFn } from "#/server/auth/functions";

export const Route = createFileRoute("/account/")({
  loader: () => getCurrentSessionFn(),
  component: () => <AccountPage session={Route.useLoaderData()} />,
});
