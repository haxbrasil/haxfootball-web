import { describe, expect, it } from "vitest";
import { hasApiPermission, type ApiPermissionSession } from "#/server/auth/permissions";

function session(input: {
  permissions?: string[];
  bypassAllPermissions?: boolean;
}): ApiPermissionSession {
  return {
    account: {
      role: {
        permissions: input.permissions ?? [],
        bypassAllPermissions: input.bypassAllPermissions ?? false,
      },
    },
  };
}

describe("hasApiPermission", () => {
  it("allows an explicitly assigned API permission", () => {
    expect(hasApiPermission(session({ permissions: ["room:admin"] }), "room:admin")).toBe(true);
  });

  it("allows wildcard API permissions", () => {
    expect(hasApiPermission(session({ permissions: ["*"] }), "account:write")).toBe(true);
  });

  it("allows API bypass roles", () => {
    expect(hasApiPermission(session({ bypassAllPermissions: true }), "stat-event:disable")).toBe(
      true,
    );
  });

  it("rejects missing API permissions", () => {
    expect(hasApiPermission(session({ permissions: ["room:read"] }), "room:admin")).toBe(false);
  });
});
