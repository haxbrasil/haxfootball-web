import type { Permission } from "@haxbrasil/haxfootball-api-sdk";

const preferredGroupOrder = [
  "room-launch",
  "room-program",
  "account",
  "role",
  "discord",
  "stat-event",
  "room",
];

export type PermissionGroup = {
  namespace: string;
  permissions: Permission[];
};

export function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const groups = new Map<string, Permission[]>();

  for (const permission of [...permissions].sort(comparePermissionKeys)) {
    const namespace = permission.key.split(":")[0] ?? "outros";
    groups.set(namespace, [...(groups.get(namespace) ?? []), permission]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => compareNamespaces(left, right))
    .map(([namespace, groupPermissions]) => ({
      namespace,
      permissions: groupPermissions,
    }));
}

export function permissionMatchesQuery(permission: Permission, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [permission.key, permission.title ?? ""].some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

function comparePermissionKeys(left: Permission, right: Permission): number {
  return left.key.localeCompare(right.key);
}

function compareNamespaces(left: string, right: string): number {
  const leftIndex = preferredGroupOrder.indexOf(left);
  const rightIndex = preferredGroupOrder.indexOf(right);

  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;

    return leftIndex - rightIndex;
  }

  return left.localeCompare(right);
}
