import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import { rolePermissionKeys } from "./role-permissions";

export function filterRoles(roles: Role[], query: string): Role[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return roles;
  }

  return roles.filter((role) =>
    [role.name, role.title.value, ...rolePermissionKeys(role)].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    ),
  );
}
