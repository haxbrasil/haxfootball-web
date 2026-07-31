import { describe, expect, it } from "vitest";
import {
  adminSections,
  canAccessImplementedAdmin,
  visibleAdminSections,
} from "#/features/admin/admin-sections";
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
    ).toEqual(["rooms", "room-programs", "matches", "championships", "accounts", "roles"]);
    expect(
      visibleAdminSections(session({ bypassAllPermissions: true })).map((section) => section.key),
    ).toEqual(["rooms", "room-programs", "matches", "championships", "accounts", "roles"]);
  });

  it("shows championships when the account has championship access", () => {
    const operator = session({ permissions: ["championship:operate"] });

    expect(visibleAdminSections(operator).map((section) => section.key)).toEqual(["championships"]);
    expect(canAccessImplementedAdmin(operator)).toBe(true);
  });

  it("accepts either championship administration or operation permission", () => {
    expect(
      visibleAdminSections(session({ permissions: ["championship:admin"] })).map(
        (section) => section.key,
      ),
    ).toEqual(["championships"]);
    expect(
      visibleAdminSections(session({ permissions: ["championship:operate"] })).map(
        (section) => section.key,
      ),
    ).toEqual(["championships"]);
  });

  it("does not treat unimplemented admin permissions as admin access", () => {
    const unrelatedSession = session({ permissions: ["event-schema:admin"] });

    expect(visibleAdminSections(unrelatedSession)).toEqual([]);
    expect(canAccessImplementedAdmin(unrelatedSession)).toBe(false);
  });

  it("describes matches as a general administrative resource", () => {
    const matchesSection = adminSections.find((section) => section.key === "matches");

    expect(matchesSection?.title).toBe("Partidas");
    expect(matchesSection?.description).toBe(
      "Consultar partidas e executar operações administrativas.",
    );
  });
});
