import { expect, test } from "@playwright/test";

test("renders the public dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "BFL" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Salas", exact: true }).first()).toBeVisible();
});

test("renders the login methods", async ({ page }) => {
  await page.goto("/account/login");

  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await expect(page.getByRole("link", { name: /entrar com discord/i })).toHaveAttribute(
    "href",
    "/api/auth/sign-in/discord",
  );
  await expect(page.getByLabel("Conta")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
});
