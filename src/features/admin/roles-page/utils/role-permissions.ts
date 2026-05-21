import type { Role } from "@haxbrasil/haxfootball-api-sdk";

export function rolePermissionKeys(role: Role): string[] {
  return role.bypassAllPermissions && !role.permissions.includes("*")
    ? ["*", ...role.permissions]
    : role.permissions;
}

export function togglePermission(selected: string[], key: string, checked: boolean): string[] {
  if (checked) {
    return selected.includes(key) ? selected : [...selected, key];
  }

  return selected.filter((permission) => permission !== key);
}
