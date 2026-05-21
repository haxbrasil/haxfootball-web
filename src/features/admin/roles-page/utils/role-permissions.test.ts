import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import { describe, expect, it } from "vitest";
import { rolePermissionKeys, togglePermission } from "./role-permissions";

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
  it("adds wildcard when the role bypasses all permissions", () => {
    const role = {
      bypassAllPermissions: true,
      permissions: ["room:admin"],
    } as Role;

    expect(rolePermissionKeys(role)).toEqual(["*", "room:admin"]);
  });
});
