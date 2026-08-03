import { useMemo, useState } from "react";
import { BarChart3, Check, ChevronsUpDown } from "lucide-react";

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

export type VisualizationFieldPickerOption = {
  value: string;
  label: string;
  detail?: string | null;
  searchTerms?: readonly string[];
  disabled?: boolean;
};

export function VisualizationFieldPicker({
  value,
  onValueChange,
  options,
  multiple = false,
  placeholder = "Selecionar campo",
  searchPlaceholder = "Buscar estatística…",
  emptyLabel = "Nenhuma estatística encontrada.",
  selectedLabel = "selecionadas",
  ariaLabel,
  disabled = false,
}: {
  value: string | readonly string[];
  onValueChange: (value: string | string[]) => void;
  options: readonly VisualizationFieldPickerOption[];
  multiple?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  selectedLabel?: string;
  ariaLabel: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const selectedOptions = selectedValues
    .map((selectedValue) => options.find((option) => option.value === selectedValue))
    .filter((option): option is VisualizationFieldPickerOption => option !== undefined);
  const filtered = useMemo(() => {
    const normalized = normalize(query);
    if (!normalized) return options;

    return options.filter((option) =>
      [option.label, option.detail, ...(option.searchTerms ?? [])]
        .filter((part): part is string => !!part)
        .some((part) => normalize(part).includes(normalized)),
    );
  }, [options, query]);

  function select(nextValue: string) {
    if (multiple) {
      onValueChange(
        selectedValues.includes(nextValue)
          ? selectedValues.filter((selectedValue) => selectedValue !== nextValue)
          : [...selectedValues, nextValue],
      );
      return;
    }

    onValueChange(nextValue);
    setOpen(false);
    setQuery("");
  }

  const summary = multiple
    ? selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0]?.label
        : `${selectedOptions.length} ${selectedLabel}`
    : (selectedOptions[0]?.label ?? placeholder);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "group w-full justify-between font-normal hover:border-ring hover:bg-muted/80 hover:text-foreground",
            '[aria-expanded="true"]:border-ring [aria-expanded="true"]:bg-muted [aria-expanded="true"]:text-foreground',
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <BarChart3 className="size-4 shrink-0 text-muted-foreground" />
            <span
              className={cn(
                "truncate",
                selectedOptions.length === 0 && "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {summary}
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
            {filtered.map((option) => {
              const selected = selectedValues.includes(option.value);
              return (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={() => select(option.value)}
                  className="min-h-11 hover:bg-muted/80 hover:text-foreground data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground",
                        multiple && "rounded-md border bg-transparent",
                      )}
                    >
                      {multiple && selected ? (
                        <Check className="size-4 text-primary" />
                      ) : (
                        <BarChart3 className="size-3.5" />
                      )}
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
                  {!multiple && selected ? <Check className="size-4 text-primary" /> : null}
                </CommandItem>
              );
            })}
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
