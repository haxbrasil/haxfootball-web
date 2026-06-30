import type { Permission, Role } from "@haxbrasil/haxfootball-api-sdk";
import { Save } from "lucide-react";
import { DataCard } from "#/components/ds/app-shell";
import { InlineFormMessage } from "#/components/ds/forms/form-message";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { localizedTextLabel } from "#/lib/localization/localized-text";
import { PermissionChecklist } from "./permission-checklist";
import { useUpdateRolePermissionsForm } from "../hooks/use-role-permissions-form";

export function RolePermissionsCard({
  role,
  permissions,
}: {
  role: Role;
  permissions: Permission[];
}) {
  const form = useUpdateRolePermissionsForm(role);

  return (
    <DataCard
      title={localizedTextLabel(role.title)}
      meta={role.bypassAllPermissions ? <Badge>Todas permissões</Badge> : null}
    >
      <form className="space-y-4" onSubmit={form.submit}>
        <PermissionChecklist
          permissions={permissions}
          selected={form.selectedPermissions}
          onChange={form.setSelectedPermissions}
        />

        <div className="flex items-center gap-2">
          <Button size="sm" disabled={form.isSubmitting} type="submit">
            <Save className="size-4" />
            Salvar permissões
          </Button>
        </div>

        {form.message ? <InlineFormMessage message={form.message} /> : null}
      </form>
    </DataCard>
  );
}
