import type { Permission } from "@haxbrasil/haxfootball-api-sdk";
import { PermissionCheckbox } from "./permission-checkbox";

export function PermissionChecklist({
  permissions,
  selected,
  onChange,
}: {
  permissions: Permission[];
  selected: string[];
  onChange: (permissions: string[]) => void;
}) {
  const hasAllPermissions = selected.includes("*");

  return (
    <div className="grid gap-3">
      <PermissionCheckbox
        permission={{ key: "*", title: "Todas permissões" }}
        selected={selected}
        onChange={onChange}
      />
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
