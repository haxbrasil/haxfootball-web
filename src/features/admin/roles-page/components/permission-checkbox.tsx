import type { Permission } from "@haxbrasil/haxfootball-api-sdk";
import { Checkbox } from "#/components/ui/checkbox";
import { Label } from "#/components/ui/label";
import { togglePermission } from "../utils/role-permissions";

export function PermissionCheckbox({
  permission,
  selected,
  onChange,
  idPrefix = "permission",
}: {
  permission: Pick<Permission, "key" | "title">;
  selected: string[];
  onChange: (permissions: string[]) => void;
  idPrefix?: string;
}) {
  const id = `${idPrefix}-${permission.key.replaceAll(":", "-").replaceAll("*", "all")}`;

  function changePermission(checked: boolean) {
    onChange(togglePermission(selected, permission.key, checked));
  }

  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <Checkbox
        id={id}
        className="mt-0.5"
        checked={selected.includes(permission.key)}
        onCheckedChange={(checked) => changePermission(checked === true)}
      />
      <Label htmlFor={id} className="grid gap-1">
        <span className="text-sm font-medium">{permission.title ?? permission.key}</span>
        <span className="text-xs text-muted-foreground">{permission.key}</span>
      </Label>
    </div>
  );
}
