import { z } from "zod";

const permissionsSchema = z.array(z.string()).catch([]);

export function serializeStoredPermissions(permissions: string[]): string {
  return JSON.stringify(permissions);
}

export function parseStoredPermissions(value: string): string[] {
  try {
    return permissionsSchema.parse(JSON.parse(value));
  } catch {
    return [];
  }
}

export function isSessionExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt <= now;
}
