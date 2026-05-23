import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "#/features/account/account-page";
import { getAccountPageDataFn } from "#/server/api/functions";

export const Route = createFileRoute("/account/")({
  loader: () => getAccountPageDataFn(),
  component: () => <AccountPage data={Route.useLoaderData()} />,
});
