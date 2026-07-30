import { ListFilter } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "#/components/ui/popover";
import { Switch } from "#/components/ui/switch";
import { cn } from "#/lib/utils";

export function MatchListFilters({
  hideScoreless,
  onHideScorelessChange,
}: {
  hideScoreless: boolean;
  onHideScorelessChange: (value: boolean) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Filtrar partidas"
          className={cn(
            "relative rounded-full border-border/80 bg-background/45",
            hideScoreless && "border-primary/45 bg-primary/10 text-primary",
          )}
        >
          <ListFilter className="size-4" />
          {hideScoreless ? (
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 size-2 rounded-full bg-primary ring-2 ring-card"
            />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-xl p-3">
        <PopoverHeader className="px-1 pb-3">
          <PopoverTitle>Filtrar partidas</PopoverTitle>
          <PopoverDescription>Escolha o que aparece neste arquivo.</PopoverDescription>
        </PopoverHeader>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/25 px-3 py-3">
          <label htmlFor="hide-scoreless-matches" className="cursor-pointer">
            <span className="block text-sm font-medium">Ocultar placares 0 × 0</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Remove partidas sem pontos.
            </span>
          </label>
          <Switch
            id="hide-scoreless-matches"
            checked={hideScoreless}
            onCheckedChange={onHideScorelessChange}
            aria-label="Ocultar partidas com placar 0 a 0"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
