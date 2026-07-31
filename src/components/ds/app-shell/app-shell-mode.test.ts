import { describe, expect, it } from "vitest";
import { isChampionshipEditorPath } from "./app-shell-mode";

describe("app shell mode", () => {
  it.each([
    "/admin/championships/edition-id",
    "/admin/championships/edition-id/",
  ])("uses the editor shell for %s", (pathname) => {
    expect(isChampionshipEditorPath(pathname)).toBe(true);
  });

  it.each([
    "/admin/championships",
    "/admin/championships/edition-id/history",
    "/championships/edition-id",
  ])("keeps the conventional shell for %s", (pathname) => {
    expect(isChampionshipEditorPath(pathname)).toBe(false);
  });
});
