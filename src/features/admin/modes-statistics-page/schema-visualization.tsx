import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Braces,
  Calculator,
  EyeOff,
  Filter,
  Flag,
  Hash,
  Search,
  Sigma,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Input } from "#/components/ui/input";
import { formatMetricCategoryLabel } from "#/lib/stats-metrics/categories";
import { formatMetricLabel, humanizeStatKey } from "#/lib/stats-metrics/labels";

type JsonRecord = Record<string, unknown>;
type SchemaEvent = JsonRecord & {
  type: string;
  aggregations: Array<JsonRecord & { metric: string; target: string }>;
};
type SchemaMetric = JsonRecord & { key: string; category?: string };
type SchemaVirtualMetric = JsonRecord & { metric: string };
type SchemaCategory = JsonRecord & { key: string };

export function SchemaOverview({ definition }: { definition: JsonRecord }) {
  const model = useMemo(() => schemaModel(definition), [definition]);
  const producedMetrics = new Set(
    model.events.flatMap((event) => event.aggregations.map((aggregation) => aggregation.metric)),
  );

  return (
    <div className="space-y-5">
      <section className="grid overflow-hidden border md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
        <MapColumn
          icon={Activity}
          title="Eventos registrados"
          value={model.events.length}
          detail="Entradas produzidas pela sala"
        />
        <MapArrow />
        <MapColumn
          icon={Sigma}
          title="Agregações"
          value={model.aggregationCount}
          detail="Regras que acumulam resultados"
        />
        <MapArrow />
        <MapColumn
          icon={Calculator}
          title="Métricas disponíveis"
          value={model.metrics.length}
          detail={`${model.virtualMetrics.length} calculadas a partir de outras métricas`}
        />
      </section>

      <section className="border">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h3 className="font-semibold">Mapa de produção</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              De onde cada estatística nasce e para quem ela é atribuída.
            </p>
          </div>
          {model.featuredMetric ? (
            <Badge className="bg-primary/15 text-primary" variant="outline">
              <Flag /> Destaque: {metricName(model.featuredMetric, model.metricByKey)}
            </Badge>
          ) : null}
        </header>
        <div className="divide-y">
          {model.events.map((event) => (
            <div
              key={event.type}
              className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(180px,0.8fr)_minmax(0,2fr)] lg:items-center"
            >
              <div className="min-w-0">
                <strong className="block truncate">{eventName(event)}</strong>
                <span className="text-xs text-muted-foreground">
                  {valueSchemaLabel(event.valueSchema)}
                </span>
              </div>
              {event.aggregations.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {event.aggregations.map((aggregation, index) => (
                    <div
                      className="contents"
                      key={`${aggregation.metric}-${aggregation.target}-${index}`}
                    >
                      {index === 0 ? <ArrowRight className="size-4 text-muted-foreground" /> : null}
                      <span className="inline-flex items-center gap-2 rounded-md border bg-muted/25 px-3 py-2 text-sm">
                        {targetIcon(aggregation.target)}
                        <span>{metricName(aggregation.metric, model.metricByKey)}</span>
                        <span className="text-xs text-muted-foreground">
                          · {targetLabel(aggregation.target)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Evento informativo, sem agregação.
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {model.metrics.some((metric) => !producedMetrics.has(metric.key)) ? (
        <p className="flex items-start gap-2 border border-dashed p-4 text-sm text-muted-foreground">
          <Braces className="mt-0.5 size-4 shrink-0" />
          Métricas sem uma origem direta podem ser preenchidas por métricas derivadas ou por outros
          produtores compatíveis com este esquema.
        </p>
      ) : null}
    </div>
  );
}

export function SchemaMetrics({ definition }: { definition: JsonRecord }) {
  const model = useMemo(() => schemaModel(definition), [definition]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = [...new Set(model.metrics.map((metric) => metric.category ?? "other"))];
  const visible = model.metrics.filter((metric) => {
    const label = metricName(metric.key, model.metricByKey);
    return (
      (category === "all" || (metric.category ?? "other") === category) &&
      `${label} ${metric.key}`.toLowerCase().includes(query.toLowerCase())
    );
  });
  const groups = categories
    .map((key) => ({
      key,
      items: visible.filter((metric) => (metric.category ?? "other") === key),
    }))
    .filter((group) => group.items.length);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar métrica"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          <CategoryFilter active={category === "all"} onClick={() => setCategory("all")}>
            Todas
          </CategoryFilter>
          {categories.map((key) => (
            <CategoryFilter key={key} active={category === key} onClick={() => setCategory(key)}>
              {categoryName(key, model.categoryByKey)}
            </CategoryFilter>
          ))}
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.key}>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold">{categoryName(group.key, model.categoryByKey)}</h3>
              <p className="text-sm text-muted-foreground">
                {categoryDescription(group.key, model.categoryByKey)}
              </p>
            </div>
            <Badge variant="outline">{group.items.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {group.items.map((metric) => (
              <article key={metric.key} className="min-w-0 border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="block truncate">
                      {metricName(metric.key, model.metricByKey)}
                    </strong>
                    <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                      {metric.key}
                    </span>
                  </div>
                  {model.featuredMetric === metric.key ? (
                    <Badge className="bg-primary/15 text-primary" variant="outline">
                      <Flag /> Destaque
                    </Badge>
                  ) : metric.hidden ? (
                    <Badge variant="secondary">
                      <EyeOff /> Oculta
                    </Badge>
                  ) : null}
                </div>
                {metric.description ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {displayText(String(metric.description))}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <MetricProperty icon={valueTypeIcon(metric.valueType)}>
                    {valueTypeLabel(metric.valueType)}
                  </MetricProperty>
                  {metric.format ? (
                    <MetricProperty icon={<Filter className="size-3" />}>
                      {formatLabel(String(metric.format))}
                    </MetricProperty>
                  ) : null}
                  {typeof metric.precision === "number" ? (
                    <MetricProperty icon={<Target className="size-3" />}>
                      {metric.precision} casas
                    </MetricProperty>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {!visible.length ? (
        <p className="border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma métrica corresponde aos filtros.
        </p>
      ) : null}
    </div>
  );
}

export function SchemaEvents({ definition }: { definition: JsonRecord }) {
  const model = useMemo(() => schemaModel(definition), [definition]);
  const [expanded, setExpanded] = useState(model.events[0]?.type ?? "");

  return (
    <div className="divide-y border">
      {model.events.map((event) => {
        const open = expanded === event.type;
        return (
          <article key={event.type}>
            <button
              type="button"
              aria-expanded={open}
              aria-label={`${open ? "Recolher" : "Detalhar"} evento ${eventName(event)}`}
              onClick={() => setExpanded(open ? "" : event.type)}
              className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-muted/30 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  <strong>{eventName(event)}</strong>
                  <span className="font-mono text-xs text-muted-foreground">{event.type}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.description
                    ? displayText(String(event.description))
                    : valueSchemaLabel(event.valueSchema)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{event.aggregations.length} agregações</Badge>
                <Badge variant="secondary">{open ? "Recolher" : "Detalhar"}</Badge>
              </div>
            </button>
            {open ? (
              <div className="border-t bg-background/45 px-5 py-5">
                <div className="grid gap-5 xl:grid-cols-[minmax(220px,0.7fr)_minmax(0,2fr)]">
                  <section>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                      Valor registrado
                    </h4>
                    <ValueSchema schema={event.valueSchema} />
                  </section>
                  <section>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                      Destinos estatísticos
                    </h4>
                    <div className="mt-3 space-y-2">
                      {event.aggregations.map((aggregation, index) => (
                        <div
                          key={`${aggregation.metric}-${index}`}
                          className="grid gap-3 border bg-card px-4 py-3 lg:grid-cols-[180px_130px_minmax(0,1fr)] lg:items-center"
                        >
                          <strong className="text-sm">
                            {metricName(aggregation.metric, model.metricByKey)}
                          </strong>
                          <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            {targetIcon(aggregation.target)} {targetLabel(aggregation.target)}
                          </span>
                          <Expression expression={aggregation.step} />
                        </div>
                      ))}
                      {!event.aggregations.length ? (
                        <p className="border border-dashed p-4 text-sm text-muted-foreground">
                          Este evento não altera métricas diretamente.
                        </p>
                      ) : null}
                    </div>
                  </section>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export function SchemaDerivedMetrics({ definition }: { definition: JsonRecord }) {
  const model = useMemo(() => schemaModel(definition), [definition]);
  if (!model.virtualMetrics.length) {
    return (
      <p className="border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhuma métrica é calculada a partir de outras métricas.
      </p>
    );
  }
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {model.virtualMetrics.map((metric) => (
        <article key={metric.metric} className="border bg-card">
          <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
            <div>
              <span className="text-xs font-semibold uppercase text-primary">
                Métrica calculada
              </span>
              <h3 className="mt-1 font-semibold">{metricName(metric.metric, model.metricByKey)}</h3>
            </div>
            {model.featuredMetric === metric.metric ? (
              <Badge className="bg-primary/15 text-primary" variant="outline">
                <Flag /> Destaque
              </Badge>
            ) : null}
          </header>
          <div className="p-4">
            <Expression expression={metric.value} large />
            <div className="mt-4 flex flex-wrap gap-2">
              {expressionDependencies(metric.value).map((dependency) => (
                <span
                  key={dependency}
                  className="rounded-md border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  usa {metricName(dependency, model.metricByKey)}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function schemaModel(definition: JsonRecord) {
  const events: SchemaEvent[] = asRecords(definition.events).map((event) => ({
    ...event,
    type: String(event.type ?? "evento"),
    aggregations: asRecords(event.aggregations).map((aggregation) => ({
      ...aggregation,
      metric: String(aggregation.metric ?? "metrica"),
      target: String(aggregation.target ?? "match"),
    })),
  }));
  const metrics: SchemaMetric[] = asRecords(definition.metrics).map((metric) => {
    const result: SchemaMetric = { ...metric, key: String(metric.key ?? "metrica") };
    if (typeof metric.category === "string") result.category = metric.category;
    return result;
  });
  const virtualMetrics: SchemaVirtualMetric[] = asRecords(definition.virtualMetrics).map(
    (metric) => ({ ...metric, metric: String(metric.metric ?? "metrica") }),
  );
  const categories: SchemaCategory[] = asRecords(definition.categories).map((category) => ({
    ...category,
    key: String(category.key ?? "other"),
  }));
  return {
    events,
    metrics,
    virtualMetrics,
    aggregationCount: events.reduce((sum, event) => sum + event.aggregations.length, 0),
    metricByKey: new Map(metrics.map((metric) => [metric.key, metric])),
    categoryByKey: new Map(categories.map((category) => [category.key, category])),
    featuredMetric:
      isRecord(definition.featuredMetrics) && typeof definition.featuredMetrics.points === "string"
        ? definition.featuredMetrics.points
        : null,
  };
}

function MapColumn({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: typeof Activity;
  title: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-4 text-primary" /> {title}
      </div>
      <strong className="mt-3 block text-3xl tabular-nums">{value}</strong>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}
function MapArrow() {
  return (
    <div className="hidden w-12 place-items-center border-x bg-muted/15 md:grid">
      <ArrowRight className="size-5 text-primary" />
    </div>
  );
}
function CategoryFilter({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-md border px-3 py-2 text-sm font-medium transition ${active ? "border-primary/50 bg-primary/15 text-primary" : "hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}
function MetricProperty({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/55 px-2 py-1 text-xs text-muted-foreground">
      {icon}
      {children}
    </span>
  );
}
function ValueSchema({ schema }: { schema: unknown }) {
  if (!isRecord(schema))
    return <p className="mt-3 text-sm text-muted-foreground">Sem valor estruturado.</p>;
  const properties = isRecord(schema.properties) ? Object.entries(schema.properties) : [];
  return (
    <div className="mt-3 space-y-2">
      <Badge variant="outline">{valueSchemaLabel(schema)}</Badge>
      {properties.map(([key, value]) => (
        <div
          key={key}
          className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-0"
        >
          <span className="font-medium">{humanizeStatKey(key)}</span>
          <span className="text-muted-foreground">{valueSchemaLabel(value)}</span>
        </div>
      ))}
    </div>
  );
}
function Expression({ expression, large = false }: { expression: unknown; large?: boolean }) {
  return (
    <div
      className={`flex min-w-0 flex-wrap items-center gap-1.5 font-mono ${large ? "text-base" : "text-xs"}`}
    >
      {expressionTokens(expression).map((token, index) => (
        <span
          key={`${token.text}-${index}`}
          className={
            token.kind === "operator"
              ? "font-bold text-primary"
              : token.kind === "metric"
                ? "rounded bg-muted px-1.5 py-0.5 text-foreground"
                : "text-muted-foreground"
          }
        >
          {token.text}
        </span>
      ))}
    </div>
  );
}
function expressionTokens(
  value: unknown,
): Array<{ text: string; kind: "operator" | "metric" | "value" }> {
  if (typeof value === "number" || typeof value === "boolean")
    return [{ text: String(value), kind: "value" }];
  if (typeof value === "string") return [{ text: value, kind: "value" }];
  if (!isRecord(value)) return [{ text: "valor", kind: "value" }];
  if (typeof value.path === "string") {
    const path = value.path.replace(/^metrics\./, "").replace(/^event\.value\.?/, "valor.");
    return [
      {
        text: path === "acc" ? "acumulado" : path,
        kind: value.path.startsWith("metrics.") ? "metric" : "value",
      },
    ];
  }
  const op = typeof value.op === "string" ? value.op : "formula";
  const args = Array.isArray(value.args) ? value.args : [];
  const symbol =
    (
      { add: "+", subtract: "−", multiply: "×", divide: "÷", coalesce: "ou" } as Record<
        string,
        string
      >
    )[op] ?? op;
  const tokens: Array<{ text: string; kind: "operator" | "metric" | "value" }> = [
    { text: "(", kind: "value" },
  ];
  args.forEach((arg, index) => {
    if (index) tokens.push({ text: symbol, kind: "operator" });
    tokens.push(...expressionTokens(arg));
  });
  tokens.push({ text: ")", kind: "value" });
  return tokens;
}
function expressionDependencies(value: unknown): string[] {
  const result = new Set<string>();
  const visit = (current: unknown) => {
    if (!isRecord(current)) return;
    if (typeof current.path === "string" && current.path.startsWith("metrics."))
      result.add(current.path.slice(8));
    if (Array.isArray(current.args)) current.args.forEach(visit);
  };
  visit(value);
  return [...result];
}
function eventName(event: JsonRecord) {
  const title =
    typeof event.title === "string"
      ? event.title
      : typeof event.presentation === "object" &&
          event.presentation &&
          "label" in event.presentation
        ? String((event.presentation as JsonRecord).label)
        : null;
  return displayText(title ?? String(event.type ?? "Evento"));
}
function metricName(key: string, metrics: Map<string, JsonRecord>) {
  const metric = metrics.get(key);
  return formatMetricLabel(key, typeof metric?.label === "string" ? metric.label : null);
}
function categoryName(key: string, categories: Map<string, JsonRecord>) {
  const category = categories.get(key);
  return formatMetricCategoryLabel({
    key,
    label: typeof category?.label === "string" ? category.label : key,
    description: null,
    primaryMetric: null,
  });
}
function categoryDescription(key: string, categories: Map<string, JsonRecord>) {
  const value = categories.get(key)?.description;
  return typeof value === "string"
    ? displayText(value)
    : "Métricas relacionadas nesta área do jogo.";
}
function displayText(value: string) {
  const key = value.replace(/^(metric|category|event)\./, "").replace(/\.description$/, "");
  return value.includes(".") ? humanizeStatKey(key) : value;
}
function targetLabel(target: string) {
  return (
    (
      { actor: "autor", subject: "alvo", team: "equipe", match: "partida" } as Record<
        string,
        string
      >
    )[target] ?? target
  );
}
function targetIcon(target: string) {
  const Icon =
    target === "actor"
      ? UserRound
      : target === "subject"
        ? Target
        : target === "team"
          ? Users
          : Flag;
  return <Icon className="size-3.5 text-primary" />;
}
function valueTypeIcon(type: unknown) {
  return type === "number" ? (
    <Hash className="size-3" />
  ) : type === "boolean" ? (
    <Flag className="size-3" />
  ) : (
    <Braces className="size-3" />
  );
}
function valueTypeLabel(type: unknown) {
  return (
    (
      {
        number: "Número",
        string: "Texto",
        boolean: "Sim ou não",
        unknown: "Valor flexível",
      } as Record<string, string>
    )[String(type ?? "unknown")] ?? "Valor flexível"
  );
}
function valueSchemaLabel(value: unknown) {
  if (!isRecord(value)) return "Sem valor adicional";
  return (
    (
      {
        number: "Número",
        string: "Texto",
        boolean: "Sim ou não",
        object: "Objeto estruturado",
        array: "Lista",
      } as Record<string, string>
    )[String(value.type ?? "unknown")] ?? "Valor flexível"
  );
}
function formatLabel(format: string) {
  return (
    (
      {
        integer: "Inteiro",
        decimal: "Decimal",
        percentage: "Porcentagem",
        duration: "Duração",
      } as Record<string, string>
    )[format] ?? humanizeStatKey(format)
  );
}
function asRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}
function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
