import type { ChangeEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";

export function SearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.currentTarget.value);
  }

  return (
    <div className="mb-4 grid max-w-md gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          onChange={handleChange}
          className="pl-9"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
