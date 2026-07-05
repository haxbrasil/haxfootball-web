import { describe, expect, it } from "vitest";
import { canImpersonateAccount } from "#/lib/auth/impersonation-policy";

function account(input: { permissions?: string[]; bypassAllPermissions?: boolean }) {
  return {
    role: {
      permissions: input.permissions ?? [],
      bypassAllPermissions: input.bypassAllPermissions ?? false,
    },
  };
}

describe("canImpersonateAccount", () => {
  it("allows targets whose permissions are a subset of the actor permissions", () => {
    expect(
      canImpersonateAccount({
        actor: account({ permissions: ["account:impersonate", "room-launch:operate"] }),
        target: account({ permissions: ["room-launch:operate"] }),
      }),
    ).toBe(true);
  });

  it("rejects targets with permissions the actor does not have", () => {
    expect(
      canImpersonateAccount({
        actor: account({ permissions: ["account:impersonate"] }),
        target: account({ permissions: ["role:admin"] }),
      }),
    ).toBe(false);
  });

  it("allows wildcard and bypass actors to impersonate any target", () => {
    expect(
      canImpersonateAccount({
        actor: account({ permissions: ["*"] }),
        target: account({ bypassAllPermissions: true }),
      }),
    ).toBe(true);
    expect(
      canImpersonateAccount({
        actor: account({ bypassAllPermissions: true }),
        target: account({ permissions: ["*"] }),
      }),
    ).toBe(true);
  });

  it("rejects wildcard or bypass targets for non-wildcard actors", () => {
    expect(
      canImpersonateAccount({
        actor: account({ permissions: ["account:impersonate", "role:admin"] }),
        target: account({ permissions: ["*"] }),
      }),
    ).toBe(false);
    expect(
      canImpersonateAccount({
        actor: account({ permissions: ["account:impersonate", "role:admin"] }),
        target: account({ bypassAllPermissions: true }),
      }),
    ).toBe(false);
  });
});
