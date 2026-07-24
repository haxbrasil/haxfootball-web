import { expect, test } from "@playwright/test";

test("renders the public dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "A maior comunidade de futebol americano do HaxBall.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Salas", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Admin", exact: true })).toHaveCount(0);
});

test("renders the login methods", async ({ page }) => {
  await page.goto("/account/login");

  await expect(page.getByRole("heading", { name: "Brazilian HaxFootball League" })).toBeVisible();
  await expect(page.getByRole("link", { name: /entrar com discord/i })).toHaveAttribute(
    "href",
    "/api/auth/sign-in/discord",
  );
  await expect(page.getByLabel("Conta")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
});

test("redirects unauthenticated match composition operators to login", async ({ page }) => {
  await page.goto("/admin/matches");

  await expect(page).toHaveURL(/\/account\/login$/);
  await expect(page.getByRole("heading", { name: "Brazilian HaxFootball League" })).toBeVisible();
});
