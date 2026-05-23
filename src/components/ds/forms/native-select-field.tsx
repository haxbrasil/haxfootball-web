import type { ChangeEvent } from "react";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";

export type NativeSelectFieldOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

export function NativeSelectField<TValue extends string>({
  id,
  label,
  name,
  value,
  defaultValue,
  required,
  options,
  emptyOption,
  onChange,
}: {
  id: string;
  label: string;
  name?: string;
  value?: TValue;
  defaultValue?: TValue;
  required?: boolean;
  options: Array<NativeSelectFieldOption<TValue>>;
  emptyOption?: NativeSelectFieldOption<TValue>;
  onChange?: (value: TValue) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange?.(event.currentTarget.value as TValue);
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        id={id}
        name={name}
        className="w-full"
        value={value}
        defaultValue={defaultValue}
        required={required}
        onChange={handleChange}
      >
        {emptyOption ? (
          <NativeSelectOption value={emptyOption.value}>{emptyOption.label}</NativeSelectOption>
        ) : null}
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
