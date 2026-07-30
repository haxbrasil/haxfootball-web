import { ListFilter, RotateCcw, Search } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "#/components/ui/popover";
import { Switch } from "#/components/ui/switch";
import { normalizeMatchIdInput } from "#/lib/matches/match-id";
import { cn } from "#/lib/utils";
import {
  getActiveMatchFilterLabels,
  type MatchKindFilter,
  type MatchListFilterState,
  type MatchStatusFilter,
} from "../utils/match-list-filters";

export function MatchListFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: MatchListFilterState;
  onChange: (patch: Partial<MatchListFilterState>) => void;
  onReset: () => void;
}) {
  const activeLabels = getActiveMatchFilterLabels(filters);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label={`Filtrar partidas${activeLabels.length ? `, ${activeLabels.length} ativos` : ""}`}
          className={cn(
            "relative rounded-full border-border/80 bg-background/45",
            activeLabels.length > 0 && "border-primary/45 bg-primary/10 text-primary",
          )}
        >
          <ListFilter className="size-4" />
          {activeLabels.length > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground ring-2 ring-card"
            >
              {activeLabels.length}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="bfl-scrollbar max-h-[min(var(--radix-popover-content-available-height),42rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl p-0 sm:w-96"
      >
        <div className="sticky top-0 z-10 border-b bg-popover/95 px-4 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <PopoverHeader>
              <PopoverTitle>Filtrar partidas</PopoverTitle>
              <PopoverDescription>Refine as partidas carregadas no arquivo.</PopoverDescription>
            </PopoverHeader>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="-mr-2 h-8 shrink-0 px-2 text-xs text-muted-foreground"
              onClick={onReset}
            >
              <RotateCcw className="size-3.5" />
              Padrão
            </Button>
          </div>

          {activeLabels.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Filtros ativos">
              {activeLabels.map((label) => (
                <Badge
                  key={label}
                  variant="outline"
                  className="border-primary/25 bg-primary/8 text-primary"
                >
                  {label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 p-4">
          <FilterSection title="Busca">
            <FilterField label="ID da partida" htmlFor="match-id-filter">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="match-id-filter"
                  value={filters.matchId}
                  placeholder="Ex.: 9JAQ-FFDQ"
                  className="pl-9 font-mono uppercase"
                  onChange={(event) =>
                    onChange({ matchId: normalizeMatchIdInput(event.target.value) })
                  }
                />
              </div>
            </FilterField>

            <FilterField label="Nome do jogador" htmlFor="match-player-filter">
              <Input
                id="match-player-filter"
                value={filters.player}
                placeholder="Digite parte do nome"
                onChange={(event) => onChange({ player: event.target.value })}
              />
            </FilterField>
          </FilterSection>

          <FilterSection title="Período">
            <div className="grid grid-cols-2 gap-3">
              <FilterField label="De" htmlFor="match-date-from">
                <Input
                  id="match-date-from"
                  type="date"
                  value={filters.dateFrom}
                  max={filters.dateTo || undefined}
                  onChange={(event) => onChange({ dateFrom: event.target.value })}
                />
              </FilterField>
              <FilterField label="Até" htmlFor="match-date-to">
                <Input
                  id="match-date-to"
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom || undefined}
                  onChange={(event) => onChange({ dateTo: event.target.value })}
                />
              </FilterField>
            </div>
          </FilterSection>

          <FilterSection title="Placar total">
            <div className="grid grid-cols-2 gap-3">
              <FilterField label="Mínimo" htmlFor="match-score-minimum">
                <Input
                  id="match-score-minimum"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={filters.minimumScore}
                  placeholder="0"
                  onChange={(event) => onChange({ minimumScore: event.target.value })}
                />
              </FilterField>
              <FilterField label="Máximo" htmlFor="match-score-maximum">
                <Input
                  id="match-score-maximum"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={filters.maximumScore}
                  placeholder="Sem limite"
                  onChange={(event) => onChange({ maximumScore: event.target.value })}
                />
              </FilterField>
            </div>
            <p className="text-xs text-muted-foreground">
              Considera a soma dos pontos dos dois times.
            </p>
          </FilterSection>

          <FilterSection title="Classificação">
            <div className="grid grid-cols-2 gap-3">
              <FilterField label="Estado" htmlFor="match-status-filter">
                <NativeSelect
                  id="match-status-filter"
                  value={filters.status}
                  className="w-full"
                  onChange={(event) =>
                    onChange({ status: event.target.value as MatchStatusFilter })
                  }
                >
                  <NativeSelectOption value="all">Todos</NativeSelectOption>
                  <NativeSelectOption value="completed">Finalizadas</NativeSelectOption>
                  <NativeSelectOption value="unfinished">Em aberto</NativeSelectOption>
                </NativeSelect>
              </FilterField>
              <FilterField label="Tipo" htmlFor="match-kind-filter">
                <NativeSelect
                  id="match-kind-filter"
                  value={filters.kind}
                  className="w-full"
                  onChange={(event) => onChange({ kind: event.target.value as MatchKindFilter })}
                >
                  <NativeSelectOption value="all">Todos</NativeSelectOption>
                  <NativeSelectOption value="single">Individuais</NativeSelectOption>
                  <NativeSelectOption value="composed">Compostas</NativeSelectOption>
                </NativeSelect>
              </FilterField>
            </div>
          </FilterSection>

          <FilterSection title="Visibilidade">
            <ToggleFilter
              id="hide-scoreless-matches"
              title="Ocultar placares 0 × 0"
              description="Remove partidas sem pontos."
              checked={filters.hideScoreless}
              onCheckedChange={(hideScoreless) => onChange({ hideScoreless })}
            />
            <ToggleFilter
              id="require-match-players"
              title="Somente com jogadores"
              description="Oculta partidas sem jogadores identificados."
              checked={filters.requirePlayers}
              onCheckedChange={(requirePlayers) => onChange({ requirePlayers })}
            />
          </FilterSection>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ToggleFilter({
  id,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/25 px-3 py-3">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  );
}
