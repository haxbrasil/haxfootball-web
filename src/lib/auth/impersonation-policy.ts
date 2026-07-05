export type ImpersonationPermissionAccount = {
  role: {
    permissions: string[];
    bypassAllPermissions: boolean;
  };
};

export function canImpersonateAccount(input: {
  actor: ImpersonationPermissionAccount;
  target: ImpersonationPermissionAccount;
}): boolean {
  const { actor, target } = input;

  if (actor.role.bypassAllPermissions || actor.role.permissions.includes("*")) {
    return true;
  }

  if (target.role.bypassAllPermissions || target.role.permissions.includes("*")) {
    return false;
  }

  const actorPermissions = new Set(actor.role.permissions);

  return target.role.permissions.every((permission) => actorPermissions.has(permission));
}
