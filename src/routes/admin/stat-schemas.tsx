import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "#/features/admin/overview-page";

export const Route = createFileRoute("/admin/stat-schemas")({
  component: AdminPage,
});
