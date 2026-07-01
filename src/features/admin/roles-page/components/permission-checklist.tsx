import { useState } from "react";
import type { Permission } from "@haxbrasil/haxfootball-api-sdk";
import { Plus } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { PermissionCheckbox } from "./permission-checkbox";
import { togglePermission } from "../utils/role-permissions";

const permissionKeyPattern = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;

export function PermissionChecklist({
  permissions,
  selected,
  onChange,
}: {
  permissions: Permission[];
  selected: string[];
  onChange: (permissions: string[]) => void;
}) {
  const [customPermission, setCustomPermission] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasAllPermissions = selected.includes("*");
  const knownPermissionKeys = new Set(permissions.map((permission) => permission.key));
  const customSelectedPermissions = selected
    .filter((permission) => permission !== "*" && !knownPermissionKeys.has(permission))
    .map((permission) => ({
      key: permission,
      title: null,
    }));

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
    <div className="grid gap-3">
      <div className="grid gap-2 rounded-md border p-3">
        <Label htmlFor="customPermission">Nova permissão</Label>
        <div className="flex gap-2">
          <Input
            id="customPermission"
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

      <PermissionCheckbox
        permission={{ key: "*", title: "Todas permissões" }}
        selected={selected}
        onChange={onChange}
      />
      {customSelectedPermissions.map((permission) => (
        <PermissionCheckbox
          key={permission.key}
          permission={permission}
          selected={selected}
          onChange={onChange}
        />
      ))}
      {hasAllPermissions
        ? null
        : permissions.map((permission) => (
            <PermissionCheckbox
              key={permission.uuid}
              permission={permission}
              selected={selected}
              onChange={onChange}
            />
          ))}
    </div>
  );
}
