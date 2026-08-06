import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
  LoaderCircle,
  Focus,
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
  publishRenderProfileFn,
  previewRenderProfileFn,
  saveRenderProfileDraftFn,
  saveVisualizationDraftFn,
} from "#/server/api/statistics-admin-functions";
import { listClipExportsFn } from "#/server/api/functions";
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
import { VisualizationFieldPicker } from "./visualization-field-picker";
import { cn } from "#/lib/utils";

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
  renderProfiles: RenderProfile[];
};
type RenderProfile = {
  uuid: string;
  title: string;
  description: string | null;
  revision: number;
  state: "active" | "archived";
  draft: { settings: RenderProfileSettings } | null;
  latestVersion: { uuid: string; version: number; settings: RenderProfileSettings } | null;
};
type RenderProfileSettings = {
  formats: Array<"mp4" | "webm" | "gif">;
  orientations: Array<"landscape" | "vertical">;
  scoreboards: string[];
  camera: {
    zoom: number;
    hudZoom: number;
    scoreboardZoom: number;
    menuZoom: number;
    locationIndicatorZoom: number;
    gameMessageZoom: number;
    parameters: Record<string, number>;
    rules: Array<{ when: string; focus?: { target: "players" }; set?: Record<string, number> }>;
  };
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
          <TabsTrigger value="rendering">
            <Focus /> Renderização de clipes
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
        <TabsContent value="rendering">
          <RenderProfilesStudio items={resources.renderProfiles} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function RenderProfilesStudio({ items }: { items: RenderProfile[] }) {
  const router = useRouter();
  const previewRenderProfile = useServerFn(previewRenderProfileFn);
  const listClipExports = useServerFn(listClipExportsFn);
  const [selectedId, setSelectedId] = useState(items[0]?.uuid ?? "");
  const selected = items.find((item) => item.uuid === selectedId) ?? items[0];
  const [title, setTitle] = useState(selected?.title ?? "");
  const [description, setDescription] = useState(selected?.description ?? "");
  const [settings, setSettings] = useState<RenderProfileSettings | null>(
    selected?.draft?.settings ?? selected?.latestVersion?.settings ?? null,
  );
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [previewClipId, setPreviewClipId] = useState("");
  const [previewExport, setPreviewExport] = useState<{
    id: string;
    status: string;
    url: string | null;
  } | null>(null);

  useEffect(() => {
    const next = items.find((item) => item.uuid === selectedId) ?? items[0];
    setTitle(next?.title ?? "");
    setDescription(next?.description ?? "");
    setSettings(next?.draft?.settings ?? next?.latestVersion?.settings ?? null);
  }, [items, selectedId]);

  useEffect(() => {
    if (!previewExport || previewExport.url || !previewClipId) return;
    const interval = window.setInterval(async () => {
      const exports = await listClipExports({ data: { id: previewClipId } });
      const current = exports.find((item) => item.id === previewExport.id);
      if (current) setPreviewExport(current);
    }, 2_500);
    return () => window.clearInterval(interval);
  }, [listClipExports, previewClipId, previewExport]);

  if (!selected || !settings) {
    return (
      <section className="border p-6 text-sm text-muted-foreground">
        Nenhum perfil de renderização disponível.
      </section>
    );
  }

  const toggle = <T extends string>(key: "formats" | "orientations" | "scoreboards", value: T) => {
    setSettings((current) => {
      if (!current) return current;
      const values = current[key] as T[];
      const next = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
      return { ...current, [key]: next } as RenderProfileSettings;
    });
  };
  const updateCamera = (key: keyof RenderProfileSettings["camera"], value: number) => {
    setSettings((current) =>
      current ? { ...current, camera: { ...current.camera, [key]: value } } : current,
    );
  };
  const save = async (mode: "draft" | "publish") => {
    setSaving(mode);
    try {
      const payload = {
        id: selected.uuid,
        title,
        description: description || null,
        settings,
        expectedRevision: selected.revision,
      };
      const result =
        mode === "draft"
          ? await saveRenderProfileDraftFn({ data: payload })
          : await publishRenderProfileFn({
              data: { id: selected.uuid, expectedRevision: selected.revision },
            });
      if (!result.ok) return toast.error(result.message);
      toast.success(mode === "draft" ? "Rascunho salvo." : "Nova versão publicada.");
      await router.invalidate();
    } finally {
      setSaving(null);
    }
  };
  const preview = async () => {
    if (!previewClipId) return toast.error("Informe o código de um clipe para a prévia.");
    setSaving("draft");
    try {
      const result = await previewRenderProfile({
        data: {
          id: selected.uuid,
          clipId: previewClipId,
          format: settings.formats[0],
          orientation: settings.orientations.includes("vertical")
            ? "vertical"
            : settings.orientations[0],
          scoreboard: settings.scoreboards[0],
          settings,
        },
      });
      if (!result.ok) return toast.error(result.message);
      setPreviewExport(result.preview);
      toast.success("Prévia adicionada à fila.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="grid border lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b lg:border-b-0 lg:border-r">
        <div className="border-b p-4">
          <strong>Perfis de câmera</strong>
        </div>
        {items.map((item) => (
          <button
            key={item.uuid}
            type="button"
            onClick={() => setSelectedId(item.uuid)}
            className={cn(
              "w-full border-b px-4 py-4 text-left transition hover:bg-muted/50",
              item.uuid === selected.uuid && "bg-muted",
            )}
          >
            <span className="block font-medium">{item.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              v{item.latestVersion?.version ?? 0} publicada
            </span>
          </button>
        ))}
      </aside>
      <main className="min-w-0">
        <header className="flex flex-col gap-4 border-b p-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Perfil de renderização</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Controle a câmera, as proporções, os placares e os formatos disponíveis para
              exportação.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={saving !== null} onClick={() => void save("draft")}>
              {saving === "draft" ? <LoaderCircle className="animate-spin" /> : <Save />} Salvar
              rascunho
            </Button>
            <Button disabled={saving !== null} onClick={() => void save("publish")}>
              {saving === "publish" ? <LoaderCircle className="animate-spin" /> : <Send />} Publicar
              versão
            </Button>
          </div>
        </header>
        <div className="grid gap-6 p-5 xl:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="render-title">Nome</Label>
              <Input
                id="render-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="render-description">Descrição</Label>
              <Input
                id="render-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <RenderToggleGroup
              label="Formatos"
              values={["mp4", "webm", "gif"]}
              selected={settings.formats}
              onToggle={(value) => toggle("formats", value)}
            />
            <RenderToggleGroup
              label="Orientações"
              values={["landscape", "vertical"]}
              selected={settings.orientations}
              onToggle={(value) => toggle("orientations", value)}
              labels={{ landscape: "Horizontal", vertical: "Vertical" }}
            />
            <RenderToggleGroup
              label="Placares"
              values={[
                "default",
                "compact",
                "score-only",
                "time-only",
                "floating-default",
                "floating-compact",
                "floating-score-only",
                "floating-time-only",
                "floating-score-time-right",
                "none",
              ]}
              selected={settings.scoreboards}
              onToggle={(value) => toggle("scoreboards", value)}
            />
          </div>
          <div className="space-y-4 border-t pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
            <div>
              <h3 className="font-semibold">Enquadramento</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                O enquadramento é aplicado pelo conversor a cada exportação e fica registrado na
                versão escolhida.
              </p>
            </div>
            <CameraNumber
              label="Zoom da ação"
              value={settings.camera.zoom}
              onChange={(value) => updateCamera("zoom", value)}
            />
            <CameraNumber
              label="Interface"
              value={settings.camera.hudZoom}
              onChange={(value) => updateCamera("hudZoom", value)}
            />
            <CameraNumber
              label="Placar"
              value={settings.camera.scoreboardZoom}
              onChange={(value) => updateCamera("scoreboardZoom", value)}
            />
            <CameraNumber
              label="Menu"
              value={settings.camera.menuZoom}
              onChange={(value) => updateCamera("menuZoom", value)}
            />
            <CameraNumber
              label="Indicador de posição"
              value={settings.camera.locationIndicatorZoom}
              onChange={(value) => updateCamera("locationIndicatorZoom", value)}
            />
            <CameraNumber
              label="Mensagens de jogo"
              value={settings.camera.gameMessageZoom}
              onChange={(value) => updateCamera("gameMessageZoom", value)}
            />
            <CameraParameters
              value={settings.camera.parameters}
              onChange={(parameters) =>
                setSettings((current) =>
                  current ? { ...current, camera: { ...current.camera, parameters } } : current,
                )
              }
            />
            <CameraRules
              value={settings.camera.rules}
              onChange={(rules) =>
                setSettings((current) =>
                  current ? { ...current, camera: { ...current.camera, rules } } : current,
                )
              }
            />
            <div className="space-y-3 border-t pt-5">
              <div>
                <h3 className="font-semibold">Prévia da câmera</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Renderize as alterações atuais em um clipe antes de salvar ou publicar a versão.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={previewClipId}
                  onChange={(event) => setPreviewClipId(event.target.value)}
                  placeholder="Código do clipe"
                  aria-label="Código do clipe para prévia"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving !== null}
                  onClick={() => void preview()}
                >
                  {saving === "draft" ? <LoaderCircle className="animate-spin" /> : <Eye />} Gerar
                  prévia
                </Button>
              </div>
              {previewExport?.url ? (
                <video
                  className="aspect-video w-full rounded-md border bg-black"
                  controls
                  autoPlay
                  loop
                  src={previewExport.url}
                />
              ) : previewExport ? (
                <p className="text-sm text-muted-foreground">A prévia está sendo renderizada.</p>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}

function RenderToggleGroup({
  label,
  values,
  selected,
  onToggle,
  labels = {},
}: {
  label: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <Button
            key={value}
            type="button"
            variant={selected.includes(value) ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(value)}
          >
            {labels[value] ?? value}
          </Button>
        ))}
      </div>
    </div>
  );
}

function CameraNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-4">
      <Label>{label}</Label>
      <Input
        type="number"
        min="0.1"
        max="20"
        step="0.1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function CameraParameters({
  value,
  onChange,
}: {
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
}) {
  const entries = Object.entries(value);
  const update = (key: string, nextKey: string, nextValue: number) => {
    const next = { ...value };
    delete next[key];
    if (nextKey.trim()) next[nextKey.trim()] = nextValue;
    onChange(next);
  };
  return (
    <div className="space-y-3 border-t pt-5">
      <div>
        <h3 className="font-semibold">Parâmetros avançados</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajustes próprios do motor de câmera deste perfil.
        </p>
      </div>
      {entries.map(([key, number]) => (
        <div key={key} className="grid grid-cols-[minmax(0,1fr)_8rem_auto] gap-2">
          <Input
            value={key}
            aria-label="Nome do parâmetro"
            onChange={(event) => update(key, event.target.value, number)}
          />
          <Input
            type="number"
            step="0.01"
            value={number}
            aria-label={`Valor de ${key}`}
            onChange={(event) => update(key, key, Number(event.target.value))}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => update(key, "", number)}
            aria-label={`Remover ${key}`}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange({ ...value, [`novo_parametro_${entries.length + 1}`]: 1 })}
      >
        <Plus /> Adicionar parâmetro
      </Button>
    </div>
  );
}

function CameraRules({
  value,
  onChange,
}: {
  value: RenderProfileSettings["camera"]["rules"];
  onChange: (value: RenderProfileSettings["camera"]["rules"]) => void;
}) {
  const update = (
    index: number,
    patch: Partial<RenderProfileSettings["camera"]["rules"][number]>,
  ) => onChange(value.map((rule, current) => (current === index ? { ...rule, ...patch } : rule)));
  return (
    <div className="space-y-3 border-t pt-5">
      <div>
        <h3 className="font-semibold">Regras de foco</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Aplique uma condição e escolha quando a câmera deve priorizar os jogadores.
        </p>
      </div>
      {value.map((rule, index) => (
        <div key={`${rule.when}-${index}`} className="space-y-2 rounded-md border p-3">
          <Input
            value={rule.when}
            aria-label="Condição da regra"
            onChange={(event) => update(index, { when: event.target.value })}
            placeholder="Condição"
          />
          <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_7rem_auto] sm:items-center">
            <Button
              type="button"
              size="sm"
              variant={rule.focus?.target === "players" ? "default" : "outline"}
              onClick={() =>
                update(index, { focus: rule.focus ? undefined : { target: "players" } })
              }
            >
              Focar jogadores
            </Button>
            <Input
              value={Object.keys(rule.set ?? {})[0] ?? ""}
              aria-label="Parâmetro ajustado pela regra"
              placeholder="Parâmetro ajustado"
              onChange={(event) => {
                const current = Object.entries(rule.set ?? {})[0];
                const key = event.target.value.trim();
                update(index, { set: key ? { [key]: current?.[1] ?? 1 } : undefined });
              }}
            />
            <Input
              type="number"
              step="0.01"
              disabled={!Object.keys(rule.set ?? {}).length}
              value={Object.values(rule.set ?? {})[0] ?? ""}
              aria-label="Valor ajustado pela regra"
              onChange={(event) => {
                const key = Object.keys(rule.set ?? {})[0];
                if (key) update(index, { set: { [key]: Number(event.target.value) } });
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onChange(value.filter((_, current) => current !== index))}
              aria-label="Remover regra"
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange([...value, { when: "game_active", focus: { target: "players" } }])}
      >
        <Plus /> Adicionar regra
      </Button>
    </div>
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
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
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
    if (saving) return;
    setSaving("draft");
    try {
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
        : await createVisualizationTemplateFn({
            data: { name, title, scope, specification: spec },
          });
      if (result.ok) {
        toast.success("Rascunho salvo");
        await router.invalidate();
      } else toast.error(localizeVisualizationError(result.message));
    } catch (error) {
      toast.error(localizeVisualizationError(error instanceof Error ? error.message : ""));
    } finally {
      setSaving(null);
    }
  };
  const publish = async () => {
    if (saving) return;
    setSaving("publish");
    try {
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
        : await createVisualizationTemplateFn({
            data: { name, title, scope, specification: spec },
          });
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
    } catch (error) {
      toast.error(localizeVisualizationError(error instanceof Error ? error.message : ""));
    } finally {
      setSaving(null);
    }
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
          <Button variant="outline" onClick={() => void save()} disabled={saving !== null}>
            {saving === "draft" ? <LoaderCircle className="animate-spin" /> : <Save />}
            {saving === "draft" ? "Salvando…" : "Salvar rascunho"}
          </Button>
          <Button onClick={() => void publish()} disabled={saving !== null}>
            {saving === "publish" ? <LoaderCircle className="animate-spin" /> : <Send />}
            {saving === "publish" ? "Publicando…" : "Publicar versão"}
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
          <VisualizationFieldPicker
            value={String(operation.field ?? firstField)}
            options={fields.map((field) => ({
              value: field.key,
              label: field.label,
              searchTerms: [field.key],
            }))}
            onValueChange={(value) => onChange({ ...operation, field: String(value) })}
            ariaLabel={`Campo da transformação ${operationLabel(type)}`}
            placeholder="Selecionar estatística"
          />
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
            <VisualizationFieldPicker
              value={filterField}
              options={fields.map((field) => ({
                value: field.key,
                label: field.label,
                searchTerms: [field.key],
              }))}
              onValueChange={(value) =>
                updateFilter(String(value), filterOperator(filterExpression.op), filterValue)
              }
              ariaLabel="Estatística do filtro"
              placeholder="Selecionar estatística"
            />
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
