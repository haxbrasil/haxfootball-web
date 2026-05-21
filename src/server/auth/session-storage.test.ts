import { describe, expect, it } from "vitest";
import {
  isSessionExpired,
  parseStoredPermissions,
  serializeStoredPermissions,
} from "#/server/auth/session-storage";

describe("session storage helpers", () => {
  it("round-trips stored API permissions", () => {
    const permissions = ["room:admin", "stat:event:disable"];

    expect(parseStoredPermissions(serializeStoredPermissions(permissions))).toEqual(permissions);
  });

  it("normalizes malformed stored API permissions to an empty list", () => {
    expect(parseStoredPermissions("not json")).toEqual([]);
    expect(parseStoredPermissions(JSON.stringify([1, null, "room:admin"]))).toEqual([]);
  });

  it("treats sessions expiring at the current instant as expired", () => {
    const now = new Date("2026-05-21T12:00:00.000Z");

    expect(isSessionExpired(now, now)).toBe(true);
    expect(isSessionExpired(new Date("2026-05-21T11:59:59.999Z"), now)).toBe(true);
    expect(isSessionExpired(new Date("2026-05-21T12:00:00.001Z"), now)).toBe(false);
  });
});
