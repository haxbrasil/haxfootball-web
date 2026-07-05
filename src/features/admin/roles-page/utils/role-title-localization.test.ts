import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import { describe, expect, it } from "vitest";
import { roleTitleKey, roleTitleLabels, trimRoleTitleLabels } from "./role-title-localization";

const languages = [
  { code: "pt", name: "Português", createdAt: "", updatedAt: "" },
  { code: "en", name: "English", createdAt: "", updatedAt: "" },
];

describe("roleTitleKey", () => {
  it("preserves existing localization keys", () => {
    expect(
      roleTitleKey({
        name: "admin",
        title: { value: "role.admin.title", label: "Admin" },
      } as Role),
    ).toBe("role.admin.title");
  });

  it("generates a stable key for literal role titles", () => {
    expect(
      roleTitleKey({
        name: "room-admin",
        title: { value: "Room admin", label: "Room admin" },
      } as Role),
    ).toBe("role.room-admin.title");
  });
});

describe("roleTitleLabels", () => {
  it("uses stored labels by language", () => {
    expect(
      roleTitleLabels({
        role: {
          title: { value: "role.admin.title", label: "Administrador" },
        } as Role,
        languages,
        value: {
          value: "role.admin.title",
          labels: [
            { language: languages[0], label: "Administrador" },
            { language: languages[1], label: "Admin" },
          ],
        },
      }),
    ).toEqual({ pt: "Administrador", en: "Admin" });
  });

  it("falls back to the resolved role title when a language is missing", () => {
    expect(
      roleTitleLabels({
        role: {
          title: { value: "role.admin.title", label: "Administrador" },
        } as Role,
        languages,
        value: {
          value: "role.admin.title",
          labels: [{ language: languages[0], label: "Administrador" }],
        },
      }),
    ).toEqual({ pt: "Administrador", en: "Administrador" });
  });
});

describe("trimRoleTitleLabels", () => {
  it("trims every language label", () => {
    expect(trimRoleTitleLabels({ pt: "  Admin  ", en: " Moderator " })).toEqual({
      pt: "Admin",
      en: "Moderator",
    });
  });
});
