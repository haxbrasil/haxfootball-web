export type PermissionRole = {
  uuid?: string;
  permissions: string[];
  bypassAllPermissions: boolean;
};

export type RoleAssignmentActor = {
  uuid?: string;
  role: PermissionRole;
};

export function canAssignRole(input: {
  actor: RoleAssignmentActor;
  role: PermissionRole;
}): boolean {
  const { actor, role } = input;

  if (actor.role.bypassAllPermissions || actor.role.permissions.includes("*")) {
    return true;
  }

  if (role.bypassAllPermissions || role.permissions.includes("*")) {
    return false;
  }

  const actorPermissions = new Set(actor.role.permissions);

  return role.permissions.every((permission) => actorPermissions.has(permission));
}

export function canChangeAccountRole(input: {
  actor: RoleAssignmentActor;
  targetAccountUuid?: string;
  currentRole: PermissionRole;
  targetRole: PermissionRole;
}): boolean {
  if (
    input.actor.uuid &&
    input.targetAccountUuid &&
    input.actor.uuid !== input.targetAccountUuid &&
    input.actor.role.uuid &&
    input.actor.role.uuid === input.targetRole.uuid
  ) {
    return false;
  }

  return (
    canAssignRole({ actor: input.actor, role: input.currentRole }) &&
    canAssignRole({ actor: input.actor, role: input.targetRole })
  );
}
