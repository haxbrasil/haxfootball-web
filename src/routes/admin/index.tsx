import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "#/features/admin/overview-page";
import { listAdminResourcesFn } from "#/server/api/functions";

export const Route = createFileRoute("/admin/")({
  loader: () => listAdminResourcesFn(),
  component: () => <AdminPage resources={Route.useLoaderData()} />,
});
