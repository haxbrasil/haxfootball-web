import { describe, expect, it } from "vitest";
import { canAccessImplementedAdmin, visibleAdminSections } from "#/features/admin/admin-sections";
import type { ApiAccountSession } from "#/server/auth/session";

function session(input: {
  permissions?: string[];
  bypassAllPermissions?: boolean;
}): ApiAccountSession {
  return {
    source: "credentials",
    account: {
      uuid: "account-id",
      externalId: "discord-id",
      name: "account",
      role: {
        title: "Role",
        permissions: input.permissions ?? [],
        bypassAllPermissions: input.bypassAllPermissions ?? false,
      },
    },
  };
}

describe("visibleAdminSections", () => {
  it("shows only sections allowed by explicit permissions", () => {
    expect(
      visibleAdminSections(
        session({
          permissions: ["room-launch:operate", "room-program:admin", "match:admin", "role:admin"],
        }),
      ).map((section) => section.key),
    ).toEqual(["rooms", "room-programs", "matches", "roles"]);
  });

  it("shows all implemented sections for wildcard or bypass roles", () => {
    expect(
      visibleAdminSections(session({ permissions: ["*"] })).map((section) => section.key),
    ).toEqual(["rooms", "room-programs", "matches", "accounts", "roles"]);
    expect(
      visibleAdminSections(session({ bypassAllPermissions: true })).map((section) => section.key),
    ).toEqual(["rooms", "room-programs", "matches", "accounts", "roles"]);
  });

  it("does not treat unimplemented admin permissions as admin access", () => {
    const unrelatedSession = session({ permissions: ["event-schema:admin"] });

    expect(visibleAdminSections(unrelatedSession)).toEqual([]);
    expect(canAccessImplementedAdmin(unrelatedSession)).toBe(false);
  });
});
