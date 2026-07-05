import type { Permission, Role } from "@haxbrasil/haxfootball-api-sdk";
import { Languages, RotateCcw, Save } from "lucide-react";
import { DataCard } from "#/components/ds/app-shell";
import { InlineFormMessage } from "#/components/ds/forms/form-message";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { Language, LocalizedValue } from "#/server/api/haxfootball";
import { localizedTextLabel } from "#/lib/localization/localized-text";
import { PermissionChecklist } from "./permission-checklist";
import { RoleTitleDialog } from "./role-title-dialog";
import { useUpdateRolePermissionsForm } from "../hooks/use-role-permissions-form";

export function RolePermissionsCard({
  role,
  permissions,
  languages,
  localizedValue,
}: {
  role: Role;
  permissions: Permission[];
  languages: Language[];
  localizedValue: LocalizedValue | null | undefined;
}) {
  const form = useUpdateRolePermissionsForm({ role, languages, localizedValue });
  const formId = `role-${role.uuid}-form`;
  const permissionCount = role.bypassAllPermissions ? "Todas" : String(role.permissions.length);

  return (
    <DataCard
      title={localizedTextLabel(role.title)}
      meta={role.bypassAllPermissions ? <Badge>Todas permissões</Badge> : null}
    >
      <form id={formId} className="grid gap-4" onSubmit={form.submit}>
        <div className="grid gap-3 rounded-md border bg-muted/25 p-3 text-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Languages className="size-3.5" />
                Títulos
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {languages.map((language) => (
                  <Badge
                    key={language.code}
                    variant="outline"
                    className="max-w-full justify-start gap-1.5"
                  >
                    <span className="font-mono text-[0.68rem] text-muted-foreground">
                      {language.code}
                    </span>
                    <span className="truncate">{form.titleLabels[language.code]}</span>
                  </Badge>
                ))}
              </div>
            </div>
            <RoleTitleDialog
              role={role}
              languages={languages}
              titleLabels={form.titleLabels}
              formId={formId}
              isDirty={form.isDirty}
              isSubmitting={form.isSubmitting}
              onChange={form.setTitleLabel}
            />
          </div>

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
