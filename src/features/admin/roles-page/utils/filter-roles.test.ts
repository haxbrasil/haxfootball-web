import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import { describe, expect, it } from "vitest";
import { filterRoles } from "./filter-roles";

const roles = [
  role("owner", "Dono", ["room-launch:operate"], true),
  role("manager", "Gerente", ["account:admin", "role:admin"], false),
  role("moderator", "Moderador", ["discord:mod"], false),
];

describe("filterRoles", () => {
  it("returns all roles for an empty query", () => {
    expect(filterRoles(roles, "")).toEqual(roles);
  });

  it("matches role name, title, and permission keys", () => {
    expect(filterRoles(roles, "manage")).toEqual([roles[1]]);
    expect(filterRoles(roles, "dono")).toEqual([roles[0]]);
    expect(filterRoles(roles, "discord")).toEqual([roles[2]]);
  });
});

function role(
  name: string,
  title: string,
  permissions: string[],
  bypassAllPermissions: boolean,
): Role {
  return {
    bypassAllPermissions,
    createdAt: "2026-01-01T00:00:00.000Z",
    isDefault: false,
    name,
    permissions,
    title: {
      label: `role.${name}.title`,
      value: title,
    },
    updatedAt: "2026-01-01T00:00:00.000Z",
    uuid: name,
  };
}
