import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  ChartNoAxesCombined,
  Copy,
  Database,
  Eye,
  FilePlus2,
  Gamepad2,
  GripVertical,
  ListFilter,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "#/components/ds/app-shell/page-header";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { VisualizationChart } from "#/features/visualizations/visualization-chart";
import type {
  JsonObject,
  JsonValue,
  RenderedVisualization,
  VisualizationSpecification,
} from "#/features/visualizations/types";
import {
  cloneEventSchemaFn,
  createEventSchemaFn,
  createGameModeFn,
  createVisualizationTemplateFn,
  previewVisualizationFn,
  publishVisualizationTemplateFn,
  saveVisualizationDraftFn,
} from "#/server/api/statistics-admin-functions";
import {
  SchemaDerivedMetrics,
  SchemaEvents,
  SchemaMetrics,
  SchemaOverview,
} from "./schema-visualization";
import {
  ChartConfigurator,
  createVisualizationFieldCatalog,
  type VisualizationFieldCatalog,
} from "./chart-configurator";

type GameMode = {
  id: string;
  name: string;
  title: { label: string } | null;
  description: { label: string } | null;
  visibility: "visible" | "hidden";
  rank: number;
};
type EventSchema = {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  version: number;
  isLatest: boolean;
  managementMode: "manual" | "external";
  managementSource: string | null;
  definition: Record<string, unknown>;
};
type Template = {
  id: string;
  name: string;
  title: string;
  description: string | null;
  scope: "match" | "championship";
  latestVersion: number | null;
  draft: { specification: VisualizationSpecification; revision: number } | null;
};
type Resources = {
  gameModes: { items: GameMode[] };
  eventSchemas: { items: EventSchema[] };
  templates: { items: Template[] };
};

const defaultSpec: VisualizationSpecification = {
  datasets: [
    {
      id: "principal",
      source: "playerMetrics",
      operations: [
        { type: "sort", field: "value", direction: "desc" },
        { type: "limit", count: 10 },
      ],
    },
  ],
  option: {
    grid: { left: 24, right: 24, top: 36, bottom: 32, containLabel: true },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category" },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        datasetId: "principal",
        encode: { x: "player", y: "value" },
        itemStyle: { borderRadius: [5, 5, 0, 0] },
      },
    ],
  },
  chart: {
    type: "bar",
    datasetId: "principal",
    fields: { category: "player", metrics: ["value"] },
    settings: {},
  },
  accessibility: { summary: "Comparação de desempenho por jogador", table: true },
};

export function ModesStatisticsPage({ resources }: { resources: Resources }) {
  return (
    <>
      <PageHeader
        title="Modos e estatísticas"
        description="Modele como as partidas registram dados e como esses dados se transformam em visualizações públicas."
      />
      <Tabs defaultValue="modes" className="space-y-5">
        <TabsList>
          <TabsTrigger value="modes">
            <Gamepad2 /> Modos
          </TabsTrigger>
          <TabsTrigger value="schemas">
            <Database /> Estatísticas
          </TabsTrigger>
          <TabsTrigger value="charts">
            <ChartNoAxesCombined /> Visualizações
          </TabsTrigger>
        </TabsList>
        <TabsContent value="modes">
          <ModesCatalog items={resources.gameModes.items} />
        </TabsContent>
        <TabsContent value="schemas">
          <SchemasStudio items={resources.eventSchemas.items} />
        </TabsContent>
        <TabsContent value="charts">
          <ChartStudio items={resources.templates.items} schemas={resources.eventSchemas.items} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function ModesCatalog({ items }: { items: GameMode[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const filtered = items.filter((item) =>
    `${item.name} ${item.title?.label ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section className="border">
      <header className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Modos de jogo</h2>
          <p className="text-sm text-muted-foreground">
            Catálogo, visibilidade e compatibilidade com esquemas de estatísticas.
          </p>
        </div>
        <CreateModeDialog onDone={() => router.invalidate()} />
      </header>
      <div className="border-b p-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar modo de jogo"
          className="max-w-md"
        />
      </div>
      <div className="divide-y">
        {filtered.map((mode) => (
          <article
            key={mode.id}
            className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{mode.title?.label ?? mode.name}</h3>
                <Badge variant="outline">
                  {mode.visibility === "visible" ? "Visível" : "Oculto"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode.description?.label ?? mode.name}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SchemasStudio({ items }: { items: EventSchema[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const definition = selected?.definition ?? {};
  const events = Array.isArray(definition.events) ? definition.events : [];
  const metrics = Array.isArray(definition.metrics) ? definition.metrics : [];
  const virtualMetrics = Array.isArray(definition.virtualMetrics) ? definition.virtualMetrics : [];
  return (
    <div className="grid min-h-[680px] border lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-b lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b p-4">
          <strong>Esquemas</strong>
          <CreateSchemaDialog />
        </div>
        <div className="divide-y">
          {items.map((schema) => (
            <button
              type="button"
              key={schema.id}
              onClick={() => setSelectedId(schema.id)}
              className={`w-full px-4 py-4 text-left transition hover:bg-muted/40 ${selected?.id === schema.id ? "bg-muted/55" : ""}`}
            >
              <span className="block font-medium">{schema.title ?? schema.name}</span>
              <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                v{schema.version}
                <span>·</span>
                {schema.managementMode === "external" ? "Gerenciado pelo programa" : "Manual"}
              </span>
            </button>
          ))}
        </div>
      </aside>
      {selected ? (
        <main className="min-w-0">
          <header className="flex flex-col gap-4 border-b p-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{selected.title ?? selected.name}</h2>
                <Badge variant={selected.managementMode === "external" ? "secondary" : "outline"}>
                  {selected.managementMode === "external" ? "Origem externa" : "Editável"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.description ??
                  selected.managementSource ??
                  "Esquema versionado de eventos e métricas."}
              </p>
            </div>
            {selected.managementMode === "external" ? (
              <CloneSchemaButton schema={selected} />
            ) : (
              <Button variant="outline">
                <Database /> Abrir editor visual
              </Button>
            )}
          </header>
          <div className="grid gap-px bg-border sm:grid-cols-3">
            <SchemaMetric label="Eventos" value={events.length} />
            <SchemaMetric label="Métricas" value={metrics.length} />
            <SchemaMetric label="Derivadas" value={virtualMetrics.length} />
          </div>
          <Tabs defaultValue="overview" className="p-5">
            <TabsList>
              <TabsTrigger value="overview">Mapa geral</TabsTrigger>
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
              <TabsTrigger value="events">Eventos e agregações</TabsTrigger>
              <TabsTrigger value="derived">Derivadas</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <SchemaOverview definition={definition} />
            </TabsContent>
            <TabsContent value="metrics">
              <SchemaMetrics definition={definition} />
            </TabsContent>
            <TabsContent value="events">
              <SchemaEvents definition={definition} />
            </TabsContent>
            <TabsContent value="derived">
              <SchemaDerivedMetrics definition={definition} />
            </TabsContent>
          </Tabs>
        </main>
      ) : null}
    </div>
  );
}

function ChartStudio({ items, schemas }: { items: Template[]; schemas: EventSchema[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "new");
  const selected = items.find((item) => item.id === selectedId);
  const [title, setTitle] = useState(selected?.title ?? "Nova visualização");
  const [name, setName] = useState(selected?.name ?? "nova-visualizacao");
  const [scope, setScope] = useState<"match" | "championship">(selected?.scope ?? "match");
  const [spec, setSpec] = useState<VisualizationSpecification>(
    selected?.draft?.specification ?? defaultSpec,
  );
  const catalog = useMemo(() => createVisualizationFieldCatalog(schemas), [schemas]);
  const [preview, setPreview] = useState<RenderedVisualization>({
    id: "preview",
    title,
    option: spec.option,
    datasets: [],
  });
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setPreviewing(true);
      const datasets = Object.fromEntries(
        [...new Set(spec.datasets.map((dataset) => dataset.source))].map((source) => [
          source,
          sampleRowsForSource(source, catalog[source] ?? []),
        ]),
      );
      void previewVisualizationFn({ data: { specification: spec, datasets } }).then((result) => {
        if (!active) return;
        setPreviewing(false);
        if (result.ok) {
          setPreview({
            ...(result.visualization as Omit<RenderedVisualization, "id" | "title">),
            id: "preview",
            title,
          });
          setPreviewError(null);
        } else setPreviewError(localizeVisualizationError(result.message));
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [catalog, spec, title]);
  const updateSpec = (next: VisualizationSpecification) => {
    setSpec(next);
  };
  const save = async () => {
    const result = selected
      ? await saveVisualizationDraftFn({
          data: {
            id: selected.id,
            expectedRevision: selected.draft?.revision ?? 0,
            name,
            title,
            scope,
            specification: spec,
          },
        })
      : await createVisualizationTemplateFn({ data: { name, title, scope, specification: spec } });
    if (result.ok) {
      toast.success("Rascunho salvo");
      await router.invalidate();
    } else toast.error(localizeVisualizationError(result.message));
  };
  const publish = async () => {
    const saved = selected
      ? await saveVisualizationDraftFn({
          data: {
            id: selected.id,
            expectedRevision: selected.draft?.revision ?? 0,
            name,
            title,
            scope,
            specification: spec,
          },
        })
      : await createVisualizationTemplateFn({ data: { name, title, scope, specification: spec } });
    if (!saved.ok) {
      toast.error(localizeVisualizationError(saved.message));
      return;
    }
    const revision = saved.template.draft?.revision;
    if (revision === undefined) {
      toast.error("Não foi possível preparar a visualização para publicação.");
      return;
    }
    const result = await publishVisualizationTemplateFn({
      data: { id: saved.template.id, expectedRevision: revision },
    });
    if (result.ok) {
      toast.success(
        result.published ? "Visualização publicada" : "Nenhuma alteração para publicar",
      );
      await router.invalidate();
    } else toast.error(localizeVisualizationError(result.message));
  };
  return (
    <div className="min-h-[760px] overflow-hidden border">
      <header className="flex flex-col gap-4 border-b p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <ChartNoAxesCombined className="size-5 text-primary" />
          <div>
            <h2 className="font-semibold">Estúdio de visualizações</h2>
            <p className="text-sm text-muted-foreground">
              Construa, teste e publique gráficos derivados das estatísticas oficiais.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={save}>
            <Save /> Salvar rascunho
          </Button>
          <Button onClick={publish}>
            <Send /> Publicar versão
          </Button>
        </div>
      </header>
      <div className="grid xl:grid-cols-[260px_minmax(460px,1fr)_320px]">
        <aside className="border-b xl:border-b-0 xl:border-r">
          <div className="border-b p-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedId("new");
                setTitle("Nova visualização");
                setName("nova-visualizacao");
                updateSpec(defaultSpec);
              }}
            >
              <Plus /> Nova visualização
            </Button>
          </div>
          <div className="divide-y">
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`w-full p-4 text-left hover:bg-muted/40 ${selectedId === item.id ? "bg-muted/55" : ""}`}
                onClick={() => {
                  setSelectedId(item.id);
                  setTitle(item.title);
                  setName(item.name);
                  setScope(item.scope);
                  updateSpec(item.draft?.specification ?? defaultSpec);
                }}
              >
                <strong className="block text-sm">{item.title}</strong>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {item.scope === "match" ? "Partida" : "Campeonato"} ·{" "}
                  {item.latestVersion ? `v${item.latestVersion}` : "não publicada"}
                </span>
              </button>
            ))}
          </div>
        </aside>
        <main className="min-w-0 border-b bg-background/40 p-5 xl:border-b-0 xl:border-r">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Prévia ao vivo
              </span>
              <h3 className="mt-1 text-lg font-semibold">{title}</h3>
            </div>
            <Badge variant={previewError ? "destructive" : "outline"}>
              <Eye />{" "}
              {previewing
                ? "Atualizando"
                : previewError
                  ? "Configuração incompleta"
                  : "Dados de exemplo"}
            </Badge>
          </div>
          {previewError ? (
            <p className="mb-3 border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {previewError}
            </p>
          ) : null}
          <VisualizationChart visualization={preview} preview />
        </main>
        <aside className="min-w-0">
          <BuilderPanel
            title={title}
            setTitle={setTitle}
            scope={scope}
            setScope={setScope}
            spec={spec}
            updateSpec={updateSpec}
            catalog={catalog}
          />
        </aside>
      </div>
    </div>
  );
}

function BuilderPanel({
  title,
  setTitle,
  scope,
  setScope,
  spec,
  updateSpec,
  catalog,
}: {
  title: string;
  setTitle: (value: string) => void;
  scope: "match" | "championship";
  setScope: (value: "match" | "championship") => void;
  spec: VisualizationSpecification;
  updateSpec: (value: VisualizationSpecification) => void;
  catalog: VisualizationFieldCatalog;
}) {
  const [newOperation, setNewOperation] = useState("sort");
  const dataset = spec.datasets[0] ?? { id: "principal", source: "playerMetrics", operations: [] };
  const operations = dataset.operations ?? [];
  const sourceFields = catalog[dataset.source] ?? [];
  const updateDataset = (patch: Partial<typeof dataset>) =>
    updateSpec({ ...spec, datasets: [{ ...dataset, ...patch }] });
  return (
    <div>
      <section className="space-y-4 border-b p-4">
        <PanelHeading icon={ChartNoAxesCombined} title="Identidade" />
        <Field label="Título">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="Aplicação">
          <NativeSelect
            value={scope}
            onChange={(event) => setScope(event.target.value as typeof scope)}
          >
            <NativeSelectOption value="match">Partidas</NativeSelectOption>
            <NativeSelectOption value="championship">Campeonatos</NativeSelectOption>
          </NativeSelect>
        </Field>
      </section>

      <ChartConfigurator spec={spec} updateSpec={updateSpec} catalog={catalog} />

      <section className="space-y-4 border-b p-4">
        <PanelHeading icon={ListFilter} title="Transformações" />
        <div className="space-y-2">
          {operations.map((operation, index) => (
            <PipelineOperation
              key={index}
              index={index}
              operation={operation}
              fields={sourceFields}
              onChange={(next) =>
                updateDataset({
                  operations: operations.map((item, itemIndex) =>
                    itemIndex === index ? next : item,
                  ),
                })
              }
              onRemove={() =>
                updateDataset({
                  operations: operations.filter((_, itemIndex) => itemIndex !== index),
                })
              }
            />
          ))}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <NativeSelect
            value={newOperation}
            onChange={(event) => setNewOperation(event.target.value)}
          >
            <NativeSelectOption value="sort">Ordenar</NativeSelectOption>
            <NativeSelectOption value="limit">Limitar resultados</NativeSelectOption>
            <NativeSelectOption value="filter">Filtrar</NativeSelectOption>
            <NativeSelectOption value="rank">Criar ranking</NativeSelectOption>
            <NativeSelectOption value="normalize">Normalizar</NativeSelectOption>
            <NativeSelectOption value="cumulative">Acumular</NativeSelectOption>
          </NativeSelect>
          <Button
            size="icon"
            variant="outline"
            title="Adicionar transformação"
            onClick={() =>
              updateDataset({
                operations: [
                  ...operations,
                  defaultOperation(
                    newOperation,
                    sourceFields.find((field) => field.kind === "number")?.key ?? "value",
                  ),
                ],
              })
            }
          >
            <Plus />
          </Button>
        </div>
      </section>
    </div>
  );
}

function PanelHeading({ icon: Icon, title }: { icon: typeof ChartNoAxesCombined; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold">
      <Icon className="size-4 text-primary" /> {title}
    </h3>
  );
}

function PipelineOperation({
  index,
  operation,
  fields,
  onChange,
  onRemove,
}: {
  index: number;
  operation: JsonObject;
  fields: VisualizationFieldCatalog[string];
  onChange: (operation: JsonObject) => void;
  onRemove: () => void;
}) {
  const type = String(operation.type ?? "sort");
  const firstField = fields[0]?.key ?? "value";
  const filterExpression =
    type === "filter" && operation.expression && typeof operation.expression === "object"
      ? (operation.expression as JsonObject)
      : {};
  const filterArgs = Array.isArray(filterExpression.args) ? filterExpression.args : [];
  const filterField =
    filterArgs[0] && typeof filterArgs[0] === "object" && "field" in filterArgs[0]
      ? String((filterArgs[0] as JsonObject).field)
      : firstField;
  const filterValue = filterArgs[1] ?? 0;
  const updateFilter = (field: string, operator: string, value: JsonValue) =>
    onChange({
      type: "filter",
      expression: {
        op: ({ greaterThan: "gt", lessThan: "lt", equal: "eq" } as Record<string, string>)[
          operator
        ],
        args: [{ field }, value],
      },
    });
  return (
    <div className="border bg-background/45">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <GripVertical className="size-4 text-muted-foreground" />
        <span className="grid size-5 place-items-center rounded bg-muted text-[10px] font-semibold">
          {index + 1}
        </span>
        <strong className="min-w-0 flex-1 truncate text-xs">{operationLabel(type)}</strong>
        <Button size="icon-sm" variant="ghost" title="Remover transformação" onClick={onRemove}>
          <Trash2 />
        </Button>
      </div>
      <div className="grid gap-2 p-3">
        {type !== "limit" && type !== "filter" ? (
          <NativeSelect
            value={String(operation.field ?? firstField)}
            onChange={(event) => onChange({ ...operation, field: event.target.value })}
          >
            {fields.map((field) => (
              <NativeSelectOption key={field.key} value={field.key}>
                {field.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : null}
        {type === "sort" ? (
          <NativeSelect
            value={String(operation.direction ?? "desc")}
            onChange={(event) => onChange({ ...operation, direction: event.target.value })}
          >
            <NativeSelectOption value="desc">Maior para menor</NativeSelectOption>
            <NativeSelectOption value="asc">Menor para maior</NativeSelectOption>
          </NativeSelect>
        ) : null}
        {type === "limit" ? (
          <Input
            type="number"
            min={1}
            max={5000}
            value={Number(operation.count ?? 10)}
            onChange={(event) => onChange({ ...operation, count: Number(event.target.value) })}
            aria-label="Quantidade máxima"
          />
        ) : null}
        {type === "filter" ? (
          <div className="grid gap-2">
            <NativeSelect
              value={filterField}
              onChange={(event) =>
                updateFilter(event.target.value, filterOperator(filterExpression.op), filterValue)
              }
            >
              {fields.map((field) => (
                <NativeSelectOption key={field.key} value={field.key}>
                  {field.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
              <NativeSelect
                value={filterOperator(filterExpression.op)}
                onChange={(event) => updateFilter(filterField, event.target.value, filterValue)}
              >
                <NativeSelectOption value="greaterThan">Maior que</NativeSelectOption>
                <NativeSelectOption value="lessThan">Menor que</NativeSelectOption>
                <NativeSelectOption value="equal">Igual a</NativeSelectOption>
              </NativeSelect>
              <Input
                value={String(filterValue)}
                onChange={(event) =>
                  updateFilter(
                    filterField,
                    filterOperator(filterExpression.op),
                    Number(event.target.value),
                  )
                }
                aria-label="Valor do filtro"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function defaultOperation(type: string, field: string): JsonObject {
  if (type === "limit") return { type, count: 10 };
  if (type === "sort") return { type, field, direction: "desc" };
  if (type === "filter") return { type, expression: { op: "gt", args: [{ field }, 0] } };
  return { type, field };
}

function filterOperator(value: unknown) {
  return (
    ({ gt: "greaterThan", lt: "lessThan", eq: "equal" } as Record<string, string>)[
      String(value ?? "gt")
    ] ?? "greaterThan"
  );
}

function sampleRowsForSource(source: string, fields: VisualizationFieldCatalog[string] = []) {
  const rows =
    source === "teams"
      ? [
          {
            team: "Equipe MJ",
            played: 4,
            wins: 3,
            draws: 0,
            losses: 1,
            pointsFor: 118,
            pointsAgainst: 84,
            differential: 34,
          },
          {
            team: "Equipe Klx",
            played: 4,
            wins: 2,
            draws: 1,
            losses: 1,
            pointsFor: 102,
            pointsAgainst: 96,
            differential: 6,
          },
          {
            team: "Equipe Gabinho",
            played: 4,
            wins: 2,
            draws: 0,
            losses: 2,
            pointsFor: 91,
            pointsAgainst: 99,
            differential: -8,
          },
          {
            team: "Equipe Dragon",
            played: 4,
            wins: 1,
            draws: 1,
            losses: 2,
            pointsFor: 80,
            pointsAgainst: 112,
            differential: -32,
          },
        ]
      : source === "events"
        ? [
            {
              type: "touchdown",
              team: "red",
              elapsedSeconds: 118,
              actor: "gabinho",
              subject: "Klx",
              value: 6,
              occurredAt: "2026-07-28T20:00:00.000Z",
            },
            {
              type: "interception",
              team: "blue",
              elapsedSeconds: 244,
              actor: "Dragon",
              subject: "gabinho",
              value: 1,
              occurredAt: "2026-07-29T20:00:00.000Z",
            },
            {
              type: "field-goal",
              team: "red",
              elapsedSeconds: 371,
              actor: "Brushi",
              subject: "",
              value: 3,
              occurredAt: "2026-07-30T20:00:00.000Z",
            },
            {
              type: "touchdown",
              team: "blue",
              elapsedSeconds: 522,
              actor: "Klx",
              subject: "Dragon",
              value: 6,
              occurredAt: "2026-07-31T20:00:00.000Z",
            },
          ]
        : source === "rounds"
          ? [
              { round: "1º tempo", player: "gabinho", value: 18 },
              { round: "1º tempo", player: "Klx", value: 14 },
              { round: "2º tempo", player: "gabinho", value: 26 },
              { round: "2º tempo", player: "Klx", value: 21 },
            ]
          : source === "players"
            ? [
                { player: "gabinho", matchesPlayed: 5, playingTimeSeconds: 2710, value: 48 },
                { player: "Klx", matchesPlayed: 5, playingTimeSeconds: 2590, value: 41 },
                { player: "Dragon", matchesPlayed: 4, playingTimeSeconds: 2180, value: 33 },
                { player: "Brushi", matchesPlayed: 4, playingTimeSeconds: 2015, value: 26 },
              ]
            : [
                { player: "gabinho", team: "Equipe A", value: 42 },
                { player: "Klx", team: "Equipe B", value: 35 },
                { player: "Dragon", team: "Equipe C", value: 27 },
                { player: "Brushi", team: "Equipe D", value: 18 },
              ];
  return rows.map((row, rowIndex) => ({
    ...row,
    ...Object.fromEntries(
      fields
        .filter((field) => field.kind === "number" && !(field.key in row))
        .map((field, fieldIndex) => [
          field.key,
          Math.max(1, Math.round((47 - rowIndex * 7 + fieldIndex * 11) % 53)),
        ]),
    ),
  }));
}

function operationLabel(type: string) {
  return (
    (
      {
        sort: "Ordenar",
        limit: "Limitar resultados",
        filter: "Filtrar",
        rank: "Criar ranking",
        normalize: "Normalizar",
        cumulative: "Acumular",
      } as Record<string, string>
    )[type] ?? type
  );
}

function localizeVisualizationError(message: string) {
  const required = message.match(/^(\w+) requires the (\w+) field$/);
  if (required) {
    const [, type, role] = required;
    return `${visualizationTypeName(type)} exige ${visualizationRoleName(role)}.`;
  }
  if (message === "Radar requires multiple metrics")
    return "Radar exige pelo menos três estatísticas.";
  if (message === "Parallel requires multiple metrics")
    return "Coordenadas paralelas exigem pelo menos duas estatísticas.";
  if (message.includes("directed cycle"))
    return "O fluxo contém um ciclo. Remova o ciclo ou use uma visualização de rede.";
  if (message === "Visualization chart references an unknown dataset")
    return "A visualização referencia uma fonte de dados que não existe mais.";
  if (message === "Visualization chart dataset was not resolved")
    return "Não foi possível carregar a fonte de dados da visualização.";
  if (message === "Unsupported visualization chart type")
    return "Este tipo de visualização não é compatível.";
  if (message === "Visualization template identifier is invalid")
    return "Use um identificador com letras minúsculas, números e hífens.";
  if (message === "Visualization template title is required")
    return "Informe um título para a visualização.";
  return message;
}

function visualizationTypeName(type: string) {
  const names: Record<string, string> = {
    bar: "O gráfico de barras",
    line: "O gráfico de linhas",
    area: "O gráfico de área",
    scatter: "O gráfico de dispersão",
    bubble: "O gráfico de bolhas",
    pie: "O gráfico de pizza",
    donut: "O gráfico de rosca",
    radar: "O radar",
    heatmap: "O mapa de calor",
    boxplot: "O boxplot",
    funnel: "O funil",
    gauge: "O medidor",
    treemap: "O treemap",
    sunburst: "O sunburst",
    sankey: "O Sankey",
    graph: "A rede",
    tree: "A árvore",
    parallel: "As coordenadas paralelas",
    calendar: "O calendário",
  };
  return names[type] ?? "A visualização";
}

function visualizationRoleName(role: string) {
  const names: Record<string, string> = {
    category: "uma categoria",
    metrics: "ao menos uma estatística",
    entity: "uma entidade",
    x: "o eixo X",
    y: "o eixo Y",
    size: "uma estatística de tamanho",
    value: "uma estatística de valor",
    path: "ao menos um nível hierárquico",
    source: "uma origem",
    target: "um destino",
    date: "uma data",
  };
  return names[role] ?? "todos os campos obrigatórios";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function SchemaMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card p-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <strong className="mt-1 block text-2xl tabular-nums">{value}</strong>
    </div>
  );
}
function CloneSchemaButton({ schema }: { schema: EventSchema }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={async () => {
        const result = await cloneEventSchemaFn({
          data: {
            id: schema.id,
            name: `${schema.name}-manual`,
            title: `${schema.title ?? schema.name} (manual)`,
          },
        });
        if (result.ok) {
          toast.success("Esquema clonado");
          await router.invalidate();
        } else toast.error(result.message);
      }}
    >
      <Copy /> Clonar como manual
    </Button>
  );
}
function CreateModeDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Novo modo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo modo de jogo</DialogTitle>
        </DialogHeader>
        <Field label="Nome público">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="Identificador">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Button
          onClick={async () => {
            const result = await createGameModeFn({
              data: { name, title, visibility: "visible", rank: 0 },
            });
            if (result.ok) {
              toast.success("Modo criado");
              setOpen(false);
              onDone();
            } else toast.error(result.message);
          }}
        >
          Criar modo
        </Button>
      </DialogContent>
    </Dialog>
  );
}
function CreateSchemaDialog() {
  const router = useRouter();
  return (
    <Button
      size="icon"
      variant="ghost"
      title="Novo esquema"
      onClick={async () => {
        const name = `esquema-${Date.now()}`;
        const result = await createEventSchemaFn({
          data: {
            name,
            title: "Novo esquema",
            definition: { events: [{ type: "evento" }], metrics: [] },
          },
        });
        if (result.ok) {
          toast.success("Esquema criado");
          await router.invalidate();
        } else toast.error(result.message);
      }}
    >
      <FilePlus2 />
    </Button>
  );
}
