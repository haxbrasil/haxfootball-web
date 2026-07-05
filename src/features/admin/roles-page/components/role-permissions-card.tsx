import type { Permission, Role } from "@haxbrasil/haxfootball-api-sdk";
import { RotateCcw, Save } from "lucide-react";
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
  const permissionCount = role.bypassAllPermissions ? "Todas" : String(role.permissions.length);

  return (
    <DataCard
      title={localizedTextLabel(role.title)}
      meta={role.bypassAllPermissions ? <Badge>Todas permissões</Badge> : null}
    >
      <form className="grid gap-4" onSubmit={form.submit}>
        <div className="grid gap-3 rounded-md border bg-muted/25 p-3 text-sm">
          <div className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Identificador
            </span>
            <span className="font-mono text-foreground">{role.name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{permissionCount} permissões</Badge>
            {role.isDefault ? <Badge variant="secondary">Padrão</Badge> : null}
          </div>
        </div>

        <div className="bfl-scrollbar max-h-[28rem] overflow-y-auto pr-3 [contain:paint]">
          <PermissionChecklist
            idPrefix={`role-${role.uuid}-permission`}
            permissions={permissions}
            selected={form.selectedPermissions}
            onChange={form.setSelectedPermissions}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button size="sm" disabled={form.isSubmitting || !form.isDirty} type="submit">
            <Save className="size-4" />
            Salvar alterações
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={form.isSubmitting || !form.isDirty}
            type="button"
            onClick={form.reset}
          >
            <RotateCcw className="size-4" />
            Descartar
          </Button>

          {form.message ? <InlineFormMessage message={form.message} /> : null}
        </div>
      </form>
    </DataCard>
  );
}
