import type { RoomLaunchConfigField } from "@haxbrasil/haxfootball-api-sdk";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";

export function LaunchConfigField({ field }: { field: RoomLaunchConfigField }) {
  const id = `launchConfig.${field.key}`;

  if (field.valueType === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox id={id} name={id} defaultChecked={field.defaultValue === true} value="true" />
        <Label htmlFor={id}>{field.displayName}</Label>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{field.displayName}</Label>
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
        <p className="text-xs text-muted-foreground">{field.description}</p>
      ) : null}
    </div>
  );
}
