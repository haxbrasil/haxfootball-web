export type ApiPermissionSession = {
  account: {
    role: {
      permissions: string[];
      bypassAllPermissions: boolean;
    };
  };
};

export function hasApiPermission(session: ApiPermissionSession, permission: string): boolean {
  return (
    session.account.role.bypassAllPermissions ||
    session.account.role.permissions.includes(permission) ||
    session.account.role.permissions.includes("*")
  );
}
