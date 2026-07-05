import type { Permission } from "@haxbrasil/haxfootball-api-sdk";
import { describe, expect, it } from "vitest";
import { groupPermissions, permissionMatchesQuery } from "./permission-groups";

describe("groupPermissions", () => {
  it("groups permissions by namespace with stable preferred order", () => {
    const groups = groupPermissions([
      permission("zeta:read"),
      permission("role:admin"),
      permission("account:admin"),
      permission("room-launch:operate"),
      permission("account:write"),
    ]);

    expect(groups.map((group) => group.namespace)).toEqual([
      "room-launch",
      "account",
      "role",
      "zeta",
    ]);
    expect(groups[1]?.permissions.map((item) => item.key)).toEqual([
      "account:admin",
      "account:write",
    ]);
  });
});

describe("permissionMatchesQuery", () => {
  it("matches permission key and title", () => {
    const item = permission("room-launch:operate", "Operate room launches");

    expect(permissionMatchesQuery(item, "launch")).toBe(true);
    expect(permissionMatchesQuery(item, "operate")).toBe(true);
    expect(permissionMatchesQuery(item, "discord")).toBe(false);
  });
});

function permission(key: string, title: string | null = null): Permission {
  return {
    createdAt: "2026-01-01T00:00:00.000Z",
    key,
    title,
    updatedAt: "2026-01-01T00:00:00.000Z",
    uuid: key,
  };
}
