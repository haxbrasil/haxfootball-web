import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "#/features/account/login-page";

export const Route = createFileRoute("/account/login")({
  component: LoginPage,
});
