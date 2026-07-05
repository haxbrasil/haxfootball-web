import { useMemo, useState } from "react";
import type { Permission } from "@haxbrasil/haxfootball-api-sdk";
import { Plus, Search } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { PermissionCheckbox } from "./permission-checkbox";
import { groupPermissions, permissionMatchesQuery } from "../utils/permission-groups";
import { togglePermission } from "../utils/role-permissions";

const permissionKeyPattern = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;

export function PermissionChecklist({
  permissions,
  selected,
  onChange,
  idPrefix = "role-permission",
}: {
  permissions: Permission[];
  selected: string[];
  onChange: (permissions: string[]) => void;
  idPrefix?: string;
}) {
  const [customPermission, setCustomPermission] = useState("");
  const [permissionQuery, setPermissionQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasAllPermissions = selected.includes("*");
  const knownPermissionKeys = new Set(permissions.map((permission) => permission.key));
  const customSelectedPermissions = selected
    .filter((permission) => permission !== "*" && !knownPermissionKeys.has(permission))
    .map((permission) => ({
      key: permission,
      title: null,
    }));
  const groupedPermissions = useMemo(() => {
    const filteredPermissions = permissions.filter((permission) =>
      permissionMatchesQuery(permission, permissionQuery),
    );

    return groupPermissions(filteredPermissions);
  }, [permissionQuery, permissions]);

  function changeAllPermissions(checked: boolean) {
    onChange(checked ? ["*"] : selected.filter((permission) => permission !== "*"));
  }

  function addCustomPermission() {
    const key = customPermission.trim();

    if (!permissionKeyPattern.test(key)) {
      setError("Use o formato recurso:acao, apenas com letras minúsculas, números e hífens.");
      return;
    }

    onChange(togglePermission(selected, key, true));
    setCustomPermission("");
    setError(null);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-4 rounded-md border p-3">
        <div className="grid gap-1">
          <Label htmlFor={`${idPrefix}-all`} className="text-sm font-semibold">
            Todas permissões
          </Label>
          <p className="text-xs text-muted-foreground">
            Libera todas as permissões atuais e futuras para este cargo.
          </p>
        </div>
        <Switch
          id={`${idPrefix}-all`}
          checked={hasAllPermissions}
          onCheckedChange={changeAllPermissions}
          aria-label="Todas permissões"
        />
      </div>

      {hasAllPermissions ? (
        <div className="rounded-md border bg-muted/35 p-3 text-sm text-muted-foreground">
          A lista individual fica oculta enquanto o cargo tem todas permissões.
        </div>
      ) : (
        <>
          <div className="grid gap-2 rounded-md border p-3">
            <Label htmlFor={`${idPrefix}-custom`}>Nova permissão</Label>
            <div className="flex gap-2">
              <Input
                id={`${idPrefix}-custom`}
                value={customPermission}
                onChange={(event) => {
                  setCustomPermission(event.target.value);
                  setError(null);
                }}
                placeholder="recurso:acao"
                pattern="[a-z][a-z0-9-]*:[a-z][a-z0-9-]*"
              />
              <Button type="button" variant="outline" onClick={addCustomPermission}>
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>

          {customSelectedPermissions.length > 0 ? (
            <section className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Customizadas
                </h3>
                <Badge variant="outline">{customSelectedPermissions.length}</Badge>
              </div>
              <div className="grid gap-2">
                {customSelectedPermissions.map((permission) => (
                  <PermissionCheckbox
                    key={permission.key}
                    idPrefix={`${idPrefix}-custom-selected`}
                    permission={permission}
                    selected={selected}
                    onChange={onChange}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-search`}>Buscar permissões</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={`${idPrefix}-search`}
                value={permissionQuery}
                onChange={(event) => setPermissionQuery(event.currentTarget.value)}
                className="pl-9"
                placeholder="Chave ou título"
              />
            </div>
          </div>

          {groupedPermissions.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Nenhuma permissão encontrada para essa busca.
            </p>
          ) : (
            <div className="grid gap-4">
              {groupedPermissions.map((group) => {
                const selectedCount = group.permissions.filter((permission) =>
                  selected.includes(permission.key),
                ).length;

                return (
                  <section key={group.namespace} className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {group.namespace}
                      </h3>
                      <Badge variant="outline">
                        {selectedCount}/{group.permissions.length}
                      </Badge>
                    </div>
                    <div className="grid gap-2">
                      {group.permissions.map((permission) => (
                        <PermissionCheckbox
                          key={permission.uuid}
                          idPrefix={`${idPrefix}-${group.namespace}`}
                          permission={permission}
                          selected={selected}
                          onChange={onChange}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
