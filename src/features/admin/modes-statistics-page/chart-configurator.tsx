import { Layers3, Network, Route, SlidersHorizontal } from "lucide-react";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Switch } from "#/components/ui/switch";
import { formatMetricLabel, humanizeStatKey } from "#/lib/stats-metrics/labels";
import type { JsonObject, VisualizationSpecification } from "#/features/visualizations/types";
import { VisualizationFieldPicker } from "./visualization-field-picker";

export type VisualizationField = {
  key: string;
  label: string;
  kind: "dimension" | "number" | "date";
  category?: string;
};
export type VisualizationFieldCatalog = Record<string, VisualizationField[]>;
type ChartType = NonNullable<VisualizationSpecification["chart"]>["type"];
type Role = {
  key: string;
  label: string;
  kind: "dimension" | "number" | "date" | "any";
  multiple?: boolean;
  minimum?: number;
  description: string;
};
type ChartDefinition = {
  type: ChartType;
  label: string;
  family: string;
  description: string;
  roles: Role[];
};

const charts: ChartDefinition[] = [
  chart("bar", "Barras", "Comparação", "Compare categorias usando uma ou mais estatísticas.", [
    dimension("category", "Categoria"),
    metrics(),
  ]),
  chart("line", "Linhas", "Evolução", "Mostre progressões e tendências entre pontos ordenados.", [
    dimension("category", "Sequência"),
    metrics(),
  ]),
  chart("area", "Área", "Evolução", "Destaque volume e progressão acumulada.", [
    dimension("category", "Sequência"),
    metrics(),
  ]),
  chart("scatter", "Dispersão", "Relação", "Compare duas estatísticas numéricas.", [
    numberRole("x", "Eixo X"),
    numberRole("y", "Eixo Y"),
  ]),
  chart(
    "bubble",
    "Bolhas",
    "Relação",
    "Compare duas estatísticas e use uma terceira para o tamanho.",
    [numberRole("x", "Eixo X"), numberRole("y", "Eixo Y"), numberRole("size", "Tamanho")],
  ),
  chart("pie", "Pizza", "Composição", "Mostre a participação de cada categoria no total.", [
    dimension("category", "Categoria"),
    numberRole("value", "Valor"),
  ]),
  chart(
    "donut",
    "Rosca",
    "Composição",
    "Mostre participação no total com um centro visual livre.",
    [dimension("category", "Categoria"), numberRole("value", "Valor")],
  ),
  chart(
    "radar",
    "Radar",
    "Perfil",
    "Compare perfis multidimensionais entre jogadores ou equipes.",
    [dimension("entity", "Entidade"), { ...metrics(), minimum: 3 }],
  ),
  chart(
    "heatmap",
    "Mapa de calor",
    "Matriz",
    "Cruze duas dimensões e represente intensidade por cor.",
    [dimension("x", "Colunas"), dimension("y", "Linhas"), numberRole("value", "Intensidade")],
  ),
  chart(
    "boxplot",
    "Boxplot",
    "Distribuição",
    "Compare mediana, quartis e extremos de distribuições.",
    [dimension("category", "Grupo"), numberRole("value", "Amostra")],
  ),
  chart("funnel", "Funil", "Fluxo", "Compare etapas ordenadas de um processo.", [
    dimension("category", "Etapa"),
    numberRole("value", "Valor"),
  ]),
  chart("gauge", "Medidor", "Indicador", "Resuma uma estatística em um indicador de progresso.", [
    numberRole("value", "Estatística"),
  ]),
  chart("treemap", "Treemap", "Hierarquia", "Compare partes de uma hierarquia pela área.", [
    pathRole(),
    numberRole("value", "Peso"),
  ]),
  chart(
    "sunburst",
    "Sunburst",
    "Hierarquia",
    "Explore níveis hierárquicos em anéis concêntricos.",
    [pathRole(), numberRole("value", "Peso")],
  ),
  chart("tree", "Árvore", "Hierarquia", "Exiba relações hierárquicas expansíveis.", [
    pathRole(),
    numberRole("value", "Peso"),
  ]),
  chart("sankey", "Sankey", "Rede", "Mostre fluxos ponderados entre origens e destinos.", [
    dimension("source", "Origem"),
    dimension("target", "Destino"),
    numberRole("value", "Peso"),
  ]),
  chart("graph", "Rede", "Rede", "Explore conexões entre jogadores, equipes ou eventos.", [
    dimension("source", "Nó de origem"),
    dimension("target", "Nó de destino"),
    numberRole("value", "Força"),
  ]),
  chart(
    "parallel",
    "Coordenadas paralelas",
    "Perfil",
    "Compare muitas estatísticas simultaneamente.",
    [dimension("entity", "Entidade"), { ...metrics(), minimum: 2 }],
  ),
  chart("calendar", "Calendário", "Tempo", "Mostre intensidade diária ao longo de um ano.", [
    {
      key: "date",
      label: "Data",
      kind: "date",
      description: "Campo temporal usado para posicionar cada dia.",
    },
    numberRole("value", "Intensidade"),
  ]),
];
export const supportedVisualizationTypes = charts.map((chart) => chart.type);

export function ChartConfigurator({
  spec,
  updateSpec,
  catalog,
}: {
  spec: VisualizationSpecification;
  updateSpec: (spec: VisualizationSpecification) => void;
  catalog: VisualizationFieldCatalog;
}) {
  const dataset = spec.datasets[0] ?? { id: "principal", source: "playerMetrics", operations: [] };
  const fields = catalog[dataset.source] ?? [];
  const current = spec.chart ?? createDefaultVisualizationChart("bar", dataset.id, fields);
  const definition = charts.find((item) => item.type === current.type) ?? charts[0];
  const setChart = (chart: NonNullable<VisualizationSpecification["chart"]>) =>
    updateSpec({ ...spec, chart: withFieldLabels(chart, fields) });
  const changeType = (type: ChartType) => {
    const next = charts.find((item) => item.type === type) ?? charts[0];
    setChart({
      type,
      datasetId: dataset.id,
      fields: defaultsFor(next, fields),
      settings: { ...defaultSettings(type), fieldLabels: fieldLabels(fields) },
    });
  };
  const changeSource = (source: string) => {
    const sourceFields = catalog[source] ?? [];
    updateSpec({
      ...spec,
      datasets: [{ ...dataset, source }],
      chart: withFieldLabels(
        { ...current, datasetId: dataset.id, fields: defaultsFor(definition, sourceFields) },
        sourceFields,
      ),
    });
  };
  const updateRole = (role: string, value: string | string[]) =>
    setChart({ ...current, fields: { ...current.fields, [role]: value } });
  const updateSetting = (key: string, value: string | number | boolean) =>
    setChart({ ...current, settings: { ...current.settings, [key]: value } });

  return (
    <>
      <section className="space-y-4 border-b p-4">
        <Heading icon={Layers3} title="Composição visual" />
        <Field label="Família e tipo">
          <NativeSelect
            value={current.type}
            onChange={(event) => changeType(event.target.value as ChartType)}
          >
            {[...new Set(charts.map((item) => item.family))].map((family) => (
              <optgroup key={family} label={family}>
                {charts
                  .filter((item) => item.family === family)
                  .map((item) => (
                    <NativeSelectOption key={item.type} value={item.type}>
                      {item.label}
                    </NativeSelectOption>
                  ))}
              </optgroup>
            ))}
          </NativeSelect>
        </Field>
        <p className="border-l-2 border-primary/60 pl-3 text-xs leading-5 text-muted-foreground">
          {definition.description}
        </p>
      </section>

      <section className="space-y-4 border-b p-4">
        <Heading icon={Route} title="Dados" />
        <Field label="Fonte de dados">
          <NativeSelect
            value={dataset.source}
            onChange={(event) => changeSource(event.target.value)}
          >
            <NativeSelectOption value="playerMetrics">Jogadores da partida</NativeSelectOption>
            <NativeSelectOption value="events">Eventos registrados</NativeSelectOption>
            <NativeSelectOption value="rounds">Tempos da partida</NativeSelectOption>
            <NativeSelectOption value="players">Jogadores do campeonato</NativeSelectOption>
            <NativeSelectOption value="teams">Equipes do campeonato</NativeSelectOption>
          </NativeSelect>
        </Field>
        {definition.roles.map((role) => {
          const roleFields = compatibleFields(fields, role.kind);

          if (role.multiple) {
            return (
              <MultipleFieldPicker
                key={role.key}
                role={role}
                fields={roleFields}
                selected={readFields(current.fields[role.key])}
                onChange={(value) => updateRole(role.key, value)}
              />
            );
          }

          return (
            <Field key={role.key} label={role.label} description={role.description}>
              {role.kind === "number" ? (
                <VisualizationFieldPicker
                  value={readFields(current.fields[role.key])[0] ?? ""}
                  options={roleFields.map(toPickerOption)}
                  onValueChange={(value) => updateRole(role.key, String(value))}
                  ariaLabel={role.label}
                  placeholder="Selecionar estatística"
                />
              ) : (
                <NativeSelect
                  value={readFields(current.fields[role.key])[0] ?? ""}
                  aria-label={role.label}
                  onChange={(event) => updateRole(role.key, event.target.value)}
                >
                  {roleFields.map((field) => (
                    <NativeSelectOption key={field.key} value={field.key}>
                      {field.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
            </Field>
          );
        })}
      </section>

      <ChartSettings chart={current} update={updateSetting} />
    </>
  );
}

function ChartSettings({
  chart,
  update,
}: {
  chart: NonNullable<VisualizationSpecification["chart"]>;
  update: (key: string, value: string | number | boolean) => void;
}) {
  const type = chart.type;
  const hasSettings = [
    "bar",
    "line",
    "area",
    "heatmap",
    "funnel",
    "gauge",
    "tree",
    "graph",
  ].includes(type);
  if (!hasSettings) return null;
  return (
    <section className="space-y-4 border-b p-4">
      <Heading icon={SlidersHorizontal} title="Aparência e comportamento" />
      {type === "bar" ? (
        <Toggle
          label="Barras horizontais"
          checked={Boolean(chart.settings?.horizontal)}
          onChange={(value) => update("horizontal", value)}
        />
      ) : null}
      {type === "line" || type === "area" ? (
        <Toggle
          label="Curva suave"
          checked={Boolean(chart.settings?.smooth)}
          onChange={(value) => update("smooth", value)}
        />
      ) : null}
      {type === "heatmap" ? (
        <Toggle
          label="Valores nas células"
          checked={chart.settings?.labels !== false}
          onChange={(value) => update("labels", value)}
        />
      ) : null}
      {type === "funnel" ? (
        <Field label="Ordenação">
          <NativeSelect
            value={String(chart.settings?.sort ?? "descending")}
            onChange={(event) => update("sort", event.target.value)}
          >
            <NativeSelectOption value="descending">Maior para menor</NativeSelectOption>
            <NativeSelectOption value="ascending">Menor para maior</NativeSelectOption>
            <NativeSelectOption value="none">Manter ordem dos dados</NativeSelectOption>
          </NativeSelect>
        </Field>
      ) : null}
      {type === "gauge" ? (
        <>
          <Field label="Resumo">
            <NativeSelect
              value={String(chart.settings?.aggregate ?? "average")}
              onChange={(event) => update("aggregate", event.target.value)}
            >
              <NativeSelectOption value="average">Média</NativeSelectOption>
              <NativeSelectOption value="sum">Soma</NativeSelectOption>
              <NativeSelectOption value="max">Máximo</NativeSelectOption>
              <NativeSelectOption value="min">Mínimo</NativeSelectOption>
              <NativeSelectOption value="latest">Último valor</NativeSelectOption>
            </NativeSelect>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Mínimo">
              <Input
                type="number"
                value={Number(chart.settings?.min ?? 0)}
                onChange={(event) => update("min", Number(event.target.value))}
              />
            </Field>
            <Field label="Máximo">
              <Input
                type="number"
                value={Number(chart.settings?.max ?? 100)}
                onChange={(event) => update("max", Number(event.target.value))}
              />
            </Field>
          </div>
        </>
      ) : null}
      {type === "tree" ? (
        <Field label="Orientação">
          <NativeSelect
            value={String(chart.settings?.orientation ?? "LR")}
            onChange={(event) => update("orientation", event.target.value)}
          >
            <NativeSelectOption value="LR">Esquerda para direita</NativeSelectOption>
            <NativeSelectOption value="TB">Cima para baixo</NativeSelectOption>
            <NativeSelectOption value="RL">Direita para esquerda</NativeSelectOption>
          </NativeSelect>
        </Field>
      ) : null}
      {type === "graph" ? (
        <Field label="Distribuição">
          <NativeSelect
            value={String(chart.settings?.layout ?? "force")}
            onChange={(event) => update("layout", event.target.value)}
          >
            <NativeSelectOption value="force">Orgânica por forças</NativeSelectOption>
            <NativeSelectOption value="circular">Circular</NativeSelectOption>
            <NativeSelectOption value="none">Posição dos dados</NativeSelectOption>
          </NativeSelect>
        </Field>
      ) : null}
    </section>
  );
}

function MultipleFieldPicker({
  role,
  fields,
  selected,
  onChange,
}: {
  role: Role;
  fields: VisualizationField[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label>{role.label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          {role.description} {role.minimum ? `Selecione pelo menos ${role.minimum}.` : ""}
        </p>
      </div>
      <VisualizationFieldPicker
        value={selected}
        options={fields.map(toPickerOption)}
        onValueChange={(value) => onChange(Array.isArray(value) ? value : [value])}
        multiple
        ariaLabel={role.label}
        placeholder="Selecionar estatísticas"
        selectedLabel="estatísticas selecionadas"
      />
    </div>
  );
}

export function createVisualizationFieldCatalog(
  schemas: Array<{ definition: Record<string, unknown> }>,
): VisualizationFieldCatalog {
  const metricMap = new Map<string, VisualizationField>();
  const eventValueMap = new Map<string, VisualizationField>();
  for (const schema of schemas) {
    const metrics = Array.isArray(schema.definition.metrics) ? schema.definition.metrics : [];
    for (const raw of metrics) {
      if (!raw || typeof raw !== "object") continue;
      const metric = raw as Record<string, unknown>;
      if (typeof metric.key !== "string" || (metric.valueType && metric.valueType !== "number"))
        continue;
      metricMap.set(metric.key, {
        key: metric.key,
        label: formatMetricLabel(
          metric.key,
          typeof metric.label === "string" ? metric.label : undefined,
        ),
        kind: "number",
        category: typeof metric.category === "string" ? metric.category : undefined,
      });
    }
    const virtual = Array.isArray(schema.definition.virtualMetrics)
      ? schema.definition.virtualMetrics
      : [];
    for (const raw of virtual)
      if (
        raw &&
        typeof raw === "object" &&
        typeof (raw as Record<string, unknown>).metric === "string"
      ) {
        const key = String((raw as Record<string, unknown>).metric);
        if (!metricMap.has(key))
          metricMap.set(key, {
            key,
            label: humanizeStatKey(key),
            kind: "number",
            category: "derived",
          });
      }
    const events = Array.isArray(schema.definition.events) ? schema.definition.events : [];
    for (const raw of events) {
      if (!raw || typeof raw !== "object") continue;
      const valueSchema = (raw as Record<string, unknown>).valueSchema;
      if (!valueSchema || typeof valueSchema !== "object") continue;
      const properties = (valueSchema as Record<string, unknown>).properties;
      if (!properties || typeof properties !== "object") continue;
      for (const [key, property] of Object.entries(properties)) {
        if (!property || typeof property !== "object") continue;
        const type = (property as Record<string, unknown>).type;
        if (type === "number" || type === "integer")
          eventValueMap.set(key, {
            key,
            label: humanizeStatKey(key),
            kind: "number",
            category: "event",
          });
        else if (type === "string" || type === "boolean")
          eventValueMap.set(key, {
            key,
            label: humanizeStatKey(key),
            kind: "dimension",
            category: "event",
          });
      }
    }
  }
  const metrics = [...metricMap.values()];
  const playerDimensions: VisualizationField[] = [
    { key: "player", label: "Jogador", kind: "dimension" },
    { key: "team", label: "Equipe", kind: "dimension" },
  ];
  return {
    playerMetrics: [...playerDimensions, ...metrics, fallbackValue()],
    players: [
      { key: "player", label: "Jogador", kind: "dimension" },
      { key: "matchesPlayed", label: "Partidas disputadas", kind: "number" },
      { key: "playingTimeSeconds", label: "Tempo em jogo", kind: "number" },
      ...metrics,
      fallbackValue(),
    ],
    teams: [
      { key: "team", label: "Equipe", kind: "dimension" },
      ...["played", "wins", "draws", "losses", "pointsFor", "pointsAgainst", "differential"].map(
        (key) => ({ key, label: canonicalLabel(key), kind: "number" as const }),
      ),
      fallbackValue(),
    ],
    events: [
      { key: "type", label: "Tipo de evento", kind: "dimension" },
      { key: "team", label: "Equipe", kind: "dimension" },
      { key: "actor", label: "Autor", kind: "dimension" },
      { key: "subject", label: "Alvo", kind: "dimension" },
      { key: "occurredAt", label: "Data", kind: "date" },
      { key: "elapsedSeconds", label: "Tempo decorrido", kind: "number" },
      ...eventValueMap.values(),
      fallbackValue(),
    ],
    rounds: [
      { key: "round", label: "Tempo", kind: "dimension" },
      { key: "player", label: "Jogador", kind: "dimension" },
      ...metrics,
      fallbackValue(),
    ],
  };
}

function chart(
  type: ChartType,
  label: string,
  family: string,
  description: string,
  roles: Role[],
): ChartDefinition {
  return { type, label, family, description, roles };
}
function dimension(key: string, label: string): Role {
  return {
    key,
    label,
    kind: "dimension",
    description: "Define como os valores serão agrupados e identificados.",
  };
}
function numberRole(key: string, label: string): Role {
  return { key, label, kind: "number", description: "Escolha uma estatística numérica." };
}
function metrics(): Role {
  return {
    key: "metrics",
    label: "Estatísticas",
    kind: "number",
    multiple: true,
    minimum: 1,
    description: "Selecione uma ou mais estatísticas para comparar.",
  };
}
function pathRole(): Role {
  return {
    key: "path",
    label: "Níveis da hierarquia",
    kind: "dimension",
    multiple: true,
    minimum: 1,
    description: "A ordem selecionada define os níveis externos e internos.",
  };
}
function readFields(value: string | string[] | undefined) {
  return Array.isArray(value) ? value : value ? [value] : [];
}
function compatibleFields(fields: VisualizationField[], kind: Role["kind"]) {
  const compatible = fields.filter((item) => kind === "any" || item.kind === kind);
  return compatible.length ? compatible : fields;
}
function toPickerOption(field: VisualizationField) {
  return {
    value: field.key,
    label: field.label,
    searchTerms: [field.key],
  };
}
function defaultsFor(definition: ChartDefinition, fields: VisualizationField[]) {
  const result: Record<string, string | string[]> = {};
  const usedSingles = new Set<string>();
  for (const role of definition.roles) {
    const available = compatibleFields(fields, role.kind);
    if (role.multiple) {
      result[role.key] = available
        .slice(0, Math.max(role.minimum ?? 1, role.key === "path" ? 2 : 3))
        .map((item) => item.key);
      continue;
    }
    const selected = available.find((item) => !usedSingles.has(item.key)) ?? available[0];
    result[role.key] = selected?.key ?? "";
    if (selected) usedSingles.add(selected.key);
  }
  return result;
}
export function createDefaultVisualizationChart(
  type: ChartType,
  datasetId: string,
  fields: VisualizationField[],
): NonNullable<VisualizationSpecification["chart"]> {
  const definition = charts.find((item) => item.type === type) ?? charts[0];
  return {
    type,
    datasetId,
    fields: defaultsFor(definition, fields),
    settings: { ...defaultSettings(type), fieldLabels: fieldLabels(fields) },
  };
}
function withFieldLabels(
  chart: NonNullable<VisualizationSpecification["chart"]>,
  fields: VisualizationField[],
) {
  return {
    ...chart,
    settings: { ...chart.settings, fieldLabels: fieldLabels(fields) },
  };
}
function fieldLabels(fields: VisualizationField[]) {
  return Object.fromEntries(fields.map((field) => [field.key, field.label]));
}
function defaultSettings(type: ChartType): JsonObject {
  if (type === "gauge") return { aggregate: "average", min: 0, max: 100 };
  if (type === "heatmap") return { labels: true };
  if (type === "line" || type === "area") return { smooth: true };
  return {};
}
function fallbackValue(): VisualizationField {
  return { key: "value", label: "Valor", kind: "number" };
}
function canonicalLabel(key: string) {
  return (
    (
      {
        played: "Jogos",
        wins: "Vitórias",
        draws: "Empates",
        losses: "Derrotas",
        pointsFor: "Pontos marcados",
        pointsAgainst: "Pontos sofridos",
        differential: "Saldo",
      } as Record<string, string>
    )[key] ?? humanizeStatKey(key)
  );
}
function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label>{label}</Label>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
function Heading({ icon: Icon, title }: { icon: typeof Network; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold">
      <Icon className="size-4 text-primary" />
      {title}
    </h3>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
