import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import { describe, expect, it } from "vitest";
import {
  roleFormIsDirty,
  rolePermissionKeys,
  samePermissionSelection,
  togglePermission,
} from "./role-permissions";

describe("togglePermission", () => {
  it("adds and removes permission keys without duplicates", () => {
    expect(togglePermission(["room:admin"], "account:admin", true)).toEqual([
      "room:admin",
      "account:admin",
    ]);
    expect(togglePermission(["room:admin"], "room:admin", true)).toEqual(["room:admin"]);
    expect(togglePermission(["room:admin", "account:admin"], "room:admin", false)).toEqual([
      "account:admin",
    ]);
  });
});

describe("rolePermissionKeys", () => {
  it("uses only wildcard input when the role bypasses all permissions", () => {
    const role = {
      bypassAllPermissions: true,
      permissions: ["room:admin"],
    } as Role;

    expect(rolePermissionKeys(role)).toEqual(["*"]);
  });
});

describe("samePermissionSelection", () => {
  it("compares selections independently from order", () => {
    expect(
      samePermissionSelection(["room:admin", "account:admin"], ["account:admin", "room:admin"]),
    ).toBe(true);
    expect(samePermissionSelection(["room:admin"], ["room:admin", "account:admin"])).toBe(false);
  });
});

describe("roleFormIsDirty", () => {
  it("tracks role title changes", () => {
    expect(
      roleFormIsDirty({
        titleLabels: { pt: "Admin", en: "Admin" },
        initialTitleLabels: { pt: "Moderador", en: "Moderator" },
        permissions: ["account:admin"],
        initialPermissions: ["account:admin"],
      }),
    ).toBe(true);
  });

  it("ignores title surrounding whitespace", () => {
    expect(
      roleFormIsDirty({
        titleLabels: { pt: "  Moderador  ", en: "  Moderator  " },
        initialTitleLabels: { pt: "Moderador", en: "Moderator" },
        permissions: ["account:admin"],
        initialPermissions: ["account:admin"],
      }),
    ).toBe(false);
  });

  it("tracks permission changes", () => {
    expect(
      roleFormIsDirty({
        titleLabels: { pt: "Moderador", en: "Moderator" },
        initialTitleLabels: { pt: "Moderador", en: "Moderator" },
        permissions: ["account:admin", "role:admin"],
        initialPermissions: ["account:admin"],
      }),
    ).toBe(true);
  });

  it("ignores permission order", () => {
    expect(
      roleFormIsDirty({
        titleLabels: { pt: "Moderador", en: "Moderator" },
        initialTitleLabels: { pt: "Moderador", en: "Moderator" },
        permissions: ["role:admin", "account:admin"],
        initialPermissions: ["account:admin", "role:admin"],
      }),
    ).toBe(false);
  });
});
