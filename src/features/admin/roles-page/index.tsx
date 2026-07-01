import type { ListPermissionsResponse, ListRolesResponse } from "@haxbrasil/haxfootball-api-sdk";
import { EmptyState, PageHeader } from "#/components/ds/app-shell";
import { CreateRoleCard } from "./components/create-role-card";
import { RolePermissionsCard } from "./components/role-permissions-card";

export { rolePermissionKeys, togglePermission } from "./utils/role-permissions";

export function AdminRolesPage({
  roles,
  permissions,
}: {
  roles: ListRolesResponse;
  permissions: ListPermissionsResponse;
}) {
  return (
    <>
      <PageHeader title="Cargos" description="Gerenciamento de cargos e permissões." />

      <div className="grid items-start gap-6 xl:grid-cols-[360px_1fr]">
        <CreateRoleCard permissions={permissions.items} />

        <div className="grid gap-4">
          {roles.items.length === 0 ? (
            <EmptyState title="Nenhum cargo encontrado" />
          ) : (
            roles.items.map((role) => (
              <RolePermissionsCard key={role.uuid} role={role} permissions={permissions.items} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
