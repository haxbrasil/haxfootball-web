import type { Role } from "@haxbrasil/haxfootball-api-sdk";
import type { RoleTitleLabels } from "./role-title-localization";

export function rolePermissionKeys(role: Role): string[] {
  return role.bypassAllPermissions ? ["*"] : role.permissions;
}

export function togglePermission(selected: string[], key: string, checked: boolean): string[] {
  if (checked) {
    return selected.includes(key) ? selected : [...selected, key];
  }

  return selected.filter((permission) => permission !== key);
}

export function samePermissionSelection(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const leftKeys = new Set(left);

  return right.every((key) => leftKeys.has(key));
}

export function sameRoleTitleLabels(left: RoleTitleLabels, right: RoleTitleLabels): boolean {
  const leftLanguages = Object.keys(left);
  const rightLanguages = Object.keys(right);

  if (leftLanguages.length !== rightLanguages.length) {
    return false;
  }

  return leftLanguages.every((language) => left[language]?.trim() === right[language]);
}

export function roleFormIsDirty(input: {
  titleLabels: RoleTitleLabels;
  initialTitleLabels: RoleTitleLabels;
  permissions: string[];
  initialPermissions: string[];
}): boolean {
  return (
    !sameRoleTitleLabels(input.titleLabels, input.initialTitleLabels) ||
    !samePermissionSelection(input.permissions, input.initialPermissions)
  );
}
