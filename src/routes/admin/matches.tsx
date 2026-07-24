import { lazy, Suspense } from "react";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { listAdminMatchesFn } from "#/server/api/admin-match-functions";

const AdminMatchesPage = lazy(() =>
  import("#/features/admin/matches-page").then((module) => ({
    default: module.AdminMatchesPage,
  })),
);

export const Route = createFileRoute("/admin/matches")({
  loader: () => listAdminMatchesFn({ data: { limit: 50 } }),
  component: AdminMatchesRoute,
});

function AdminMatchesRoute() {
  const matches = useLoaderData({ from: "/admin/matches" });

  return (
    <Suspense fallback={null}>
      <AdminMatchesPage matches={matches} />
    </Suspense>
  );
}
