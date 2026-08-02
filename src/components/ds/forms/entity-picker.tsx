import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, UserRound } from "lucide-react";

import { Button } from "#/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { cn } from "#/lib/utils";

export type EntityPickerOption = {
  value: string;
  label: string;
  detail?: string | null;
  searchTerms?: readonly string[];
  disabled?: boolean;
};

export function EntityPicker({
  value,
  onValueChange,
  options,
  id,
  name,
  placeholder = "Selecionar pessoa",
  searchPlaceholder = "Buscar por nome…",
  emptyLabel = "Nenhum resultado encontrado.",
  ariaLabel,
  disabled = false,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly EntityPickerOption[];
  id?: string;
  name?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value) ?? null;
  const filtered = useMemo(() => {
    const normalized = normalize(query);
    if (!normalized) return options;

    return options.filter((option) =>
      [option.label, option.detail, ...(option.searchTerms ?? [])]
        .filter((part): part is string => !!part)
        .some((part) => normalize(part).includes(normalized)),
    );
  }, [options, query]);

  function select(next: string) {
    onValueChange(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "group w-full justify-between font-normal hover:border-ring hover:bg-muted/80 hover:text-foreground",
            '[aria-expanded="true"]:border-ring [aria-expanded="true"]:bg-muted [aria-expanded="true"]:text-foreground',
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <UserRound className="size-4 shrink-0 text-muted-foreground" />
            <span
              className={cn(
                "truncate",
                !selected && "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {selected?.label ?? placeholder}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(30rem,calc(100vw-2rem))] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
            aria-label={ariaLabel}
          />
          <CommandList className="bfl-scrollbar max-h-72">
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            {filtered.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                onSelect={() => select(option.value)}
                className="min-h-11 hover:bg-muted/80 hover:text-foreground data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {initials(option.label)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{option.label}</span>
                    {option.detail ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.detail}
                      </span>
                    ) : null}
                  </span>
                </span>
                {option.value === value ? <Check className="size-4 text-primary" /> : null}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function initials(label: string) {
  return label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
