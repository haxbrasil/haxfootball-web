import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/championships/$slug")({
  component: Outlet,
});
