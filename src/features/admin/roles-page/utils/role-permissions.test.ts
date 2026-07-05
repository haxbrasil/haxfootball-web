import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import { describe, expect, it } from "vitest";
import { rolePermissionKeys, samePermissionSelection, togglePermission } from "./role-permissions";

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
