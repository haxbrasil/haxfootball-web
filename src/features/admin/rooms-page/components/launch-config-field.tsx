import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { localizedTextLabel } from "#/lib/localization/localized-text";
import type { WebRoomLaunchConfigField } from "../utils/launch-config";

export function LaunchConfigField({ field }: { field: WebRoomLaunchConfigField }) {
  const id = `launchConfig.${field.key}`;
  const label = localizedTextLabel(field.label);

  if (field.valueType === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox id={id} name={id} defaultChecked={field.defaultValue === true} value="true" />
        <Label htmlFor={id}>{label}</Label>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {field.enumValues?.length ? (
        <NativeSelect
          id={id}
          name={id}
          defaultValue={String(field.defaultValue ?? "")}
          required={field.required}
          className="w-full"
        >
          {!field.required ? <NativeSelectOption value="">Nenhum</NativeSelectOption> : null}
          {field.enumValues.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {value}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : (
        <Input
          id={id}
          name={id}
          type={field.valueType === "number" ? "number" : field.secret ? "password" : "text"}
          defaultValue={field.defaultValue === null ? "" : String(field.defaultValue ?? "")}
          min={field.minimum}
          max={field.maximum}
          required={field.required}
          autoComplete="off"
        />
      )}
      {field.description ? (
        <p className="text-xs text-muted-foreground">{localizedTextLabel(field.description)}</p>
      ) : null}
    </div>
  );
}
