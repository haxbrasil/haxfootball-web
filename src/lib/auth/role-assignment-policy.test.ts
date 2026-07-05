import { describe, expect, it } from "vitest";
import { canAssignRole, canChangeAccountRole } from "./role-assignment-policy";

function account(input: {
  uuid?: string;
  roleUuid?: string;
  permissions?: string[];
  bypassAllPermissions?: boolean;
}) {
  return {
    uuid: input.uuid,
    role: role({
      uuid: input.roleUuid,
      permissions: input.permissions,
      bypassAllPermissions: input.bypassAllPermissions,
    }),
  };
}

function role(input: {
  uuid?: string;
  roleUuid?: string;
  permissions?: string[];
  bypassAllPermissions?: boolean;
}) {
  return {
    uuid: input.uuid ?? input.roleUuid,
    permissions: input.permissions ?? [],
    bypassAllPermissions: input.bypassAllPermissions ?? false,
  };
}

describe("canAssignRole", () => {
  it("allows roles whose permissions are a subset of the actor permissions", () => {
    expect(
      canAssignRole({
        actor: account({ permissions: ["account-role:update", "room:admin"] }),
        role: role({ permissions: ["room:admin"] }),
      }),
    ).toBe(true);
  });

  it("rejects roles with permissions the actor does not have", () => {
    expect(
      canAssignRole({
        actor: account({ permissions: ["account-role:update"] }),
        role: role({ permissions: ["role:admin"] }),
      }),
    ).toBe(false);
  });

  it("allows wildcard or bypass actors to assign any role", () => {
    expect(
      canAssignRole({
        actor: account({ permissions: ["*"] }),
        role: role({ bypassAllPermissions: true }),
      }),
    ).toBe(true);
    expect(
      canAssignRole({
        actor: account({ bypassAllPermissions: true }),
        role: role({ permissions: ["*"] }),
      }),
    ).toBe(true);
  });
});

describe("canChangeAccountRole", () => {
  it("allows changing roles when both current and target roles are within the actor permissions", () => {
    expect(
      canChangeAccountRole({
        actor: account({ permissions: ["account-role:update", "room:admin"] }),
        currentRole: role({ permissions: ["room:admin"] }),
        targetRole: role({ permissions: [] }),
      }),
    ).toBe(true);
  });

  it("rejects changing accounts whose current role is above the actor", () => {
    expect(
      canChangeAccountRole({
        actor: account({ permissions: ["account-role:update"] }),
        currentRole: role({ permissions: ["role:admin"] }),
        targetRole: role({ permissions: [] }),
      }),
    ).toBe(false);
  });

  it("rejects assigning roles above the actor", () => {
    expect(
      canChangeAccountRole({
        actor: account({ permissions: ["account-role:update"] }),
        currentRole: role({ permissions: [] }),
        targetRole: role({ permissions: ["role:admin"] }),
      }),
    ).toBe(false);
  });

  it("rejects assigning the actor own role to another account", () => {
    expect(
      canChangeAccountRole({
        actor: account({
          uuid: "actor-account",
          roleUuid: "moderator",
          permissions: ["account-role:update", "room-launch:operate"],
        }),
        targetAccountUuid: "target-account",
        currentRole: role({ permissions: [] }),
        targetRole: role({ uuid: "moderator", permissions: ["room-launch:operate"] }),
      }),
    ).toBe(false);
  });

  it("allows keeping the actor own role on the actor account", () => {
    expect(
      canChangeAccountRole({
        actor: account({
          uuid: "actor-account",
          roleUuid: "moderator",
          permissions: ["account-role:update", "room-launch:operate"],
        }),
        targetAccountUuid: "actor-account",
        currentRole: role({ uuid: "moderator", permissions: ["room-launch:operate"] }),
        targetRole: role({ uuid: "moderator", permissions: ["room-launch:operate"] }),
      }),
    ).toBe(true);
  });
});
