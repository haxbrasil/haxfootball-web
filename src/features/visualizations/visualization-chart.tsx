import { useEffect, useRef, useState } from "react";
import { Download, Expand, Table2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "#/components/ui/dialog";
import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";
import type { RenderedVisualization, VisualizationRow } from "./types";

export function VisualizationChart({
  visualization,
  preview = false,
  className,
}: {
  visualization: RenderedVisualization;
  preview?: boolean;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<import("echarts").ECharts | null>(null);
  const [ready, setReady] = useState(false);
  const [renderError, setRenderError] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const pointCount = visualization.datasets.reduce((sum, dataset) => sum + dataset.rows.length, 0);
  const hasData = pointCount > 0;

  useEffect(() => {
    if (visualization.renderError) {
      setReady(true);
      setRenderError(true);
      return;
    }
    let disposed = false;
    let observer: ResizeObserver | undefined;
    setReady(false);
    setRenderError(false);
    void import("echarts")
      .then((echarts) => {
        if (disposed || !container.current) return;
        chart.current = echarts.init(container.current, "dark", {
          renderer: pointCount > 1000 ? "canvas" : "svg",
        });
        chart.current.setOption(
          {
            backgroundColor: "transparent",
            textStyle: { fontFamily: "Inter, ui-sans-serif, system-ui", color: "#d7dee8" },
            color: ["#7ca5c7", "#43b8a7", "#e2bb62", "#d66b63", "#a18acb", "#8fa2b8"],
            animationDuration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450,
            tooltip: {
              trigger: "item",
              backgroundColor: "#0b1119",
              borderColor: "#344153",
              textStyle: { color: "#eef3f8" },
            },
            ...visualization.option,
            dataset: visualization.datasets.map((dataset) => ({
              id: dataset.id,
              source: dataset.rows,
            })),
          },
          { notMerge: true },
        );
        observer = new ResizeObserver(() => chart.current?.resize());
        observer.observe(container.current);
        setReady(true);
      })
      .catch(() => {
        if (!disposed) {
          setReady(true);
          setRenderError(true);
        }
      });
    return () => {
      disposed = true;
      observer?.disconnect();
      chart.current?.dispose();
      chart.current = null;
    };
  }, [visualization, pointCount]);

  const content = (
    <div
      className={cn(
        "relative min-h-0",
        fullScreen ? "h-[calc(100vh-8rem)]" : chartHeight(visualization.layout?.height),
      )}
    >
      {!ready ? <Skeleton className="absolute inset-0 bg-neutral-800/70" /> : null}
      {renderError ? (
        <div className="absolute inset-0 z-10 grid place-items-center p-6 text-center">
          <div>
            <strong className="block text-sm">Não foi possível renderizar este gráfico</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              Os demais gráficos e os dados tabulares continuam disponíveis.
            </span>
          </div>
        </div>
      ) : null}
      {ready && !renderError && !hasData ? (
        <div className="absolute inset-0 z-10 grid place-items-center p-6 text-center">
          <div>
            <strong className="block text-sm">Ainda não há dados para esta visualização</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              Ela aparecerá quando a edição tiver estatísticas compatíveis.
            </span>
          </div>
        </div>
      ) : null}
      <div
        ref={container}
        className="size-full"
        role="img"
        aria-label={visualization.accessibility?.summary ?? visualization.title}
      />
    </div>
  );

  return (
    <section
      className={cn(
        "bfl-panel min-w-0 overflow-hidden rounded-xl border border-border/80 text-card-foreground shadow-[0_18px_58px_color-mix(in_oklch,black_28%,transparent)]",
        widthClass(visualization.layout?.width),
        className,
      )}
    >
      <header className="flex items-center justify-between gap-4 border-b border-border/75 bg-muted/30 px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-card-foreground">{visualization.title}</h3>
          {visualization.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{visualization.description}</p>
          ) : null}
        </div>
        {!preview ? (
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-background/35 p-1">
            <Button
              variant="ghost"
              size="icon"
              title="Ver dados"
              onClick={() => setTableOpen(true)}
            >
              <Table2 />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Tela cheia"
              onClick={() => setFullScreen(true)}
            >
              <Expand />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Baixar imagem"
              onClick={() => downloadChart(chart.current, visualization.title)}
            >
              <Download />
            </Button>
          </div>
        ) : null}
      </header>
      {content}
      <Dialog open={tableOpen} onOpenChange={setTableOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Dados de {visualization.title}</DialogTitle>
          </DialogHeader>
          <VisualizationDataTable datasets={visualization.datasets} />
        </DialogContent>
      </Dialog>
      <Dialog open={fullScreen} onOpenChange={setFullScreen}>
        <DialogContent className="max-w-[96vw] p-0">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>{visualization.title}</DialogTitle>
          </DialogHeader>
          {fullScreen ? (
            <VisualizationChart
              visualization={{ ...visualization, layout: { width: "full", height: "viewport" } }}
              preview
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function VisualizationDashboardView({ items }: { items: RenderedVisualization[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Visualizações" className="grid grid-cols-1 gap-4 lg:grid-cols-6">
      {items.map((item) => (
        <VisualizationChart
          key={item.id}
          visualization={item}
          className={items.length === 1 ? "lg:col-span-6" : undefined}
        />
      ))}
    </section>
  );
}

function VisualizationDataTable({
  datasets,
}: {
  datasets: Array<{ id: string; rows: VisualizationRow[] }>;
}) {
  return (
    <div className="max-h-[65vh] space-y-5 overflow-auto">
      {datasets.map((dataset) => {
        const columns = [...new Set(dataset.rows.flatMap(Object.keys))];
        return (
          <section key={dataset.id}>
            <h4 className="mb-2 text-sm font-semibold">{dataset.id}</h4>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="border px-3 py-2 text-left">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.rows.map((row, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td key={column} className="border px-3 py-2 tabular-nums">
                        {formatCell(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
function formatCell(value: unknown) {
  return typeof value === "number"
    ? new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)
    : String(value ?? "—");
}
function widthClass(width = "half") {
  return width === "full"
    ? "lg:col-span-6"
    : width === "compact"
      ? "lg:col-span-2"
      : "lg:col-span-3";
}
function chartHeight(height = "medium") {
  return height === "short"
    ? "h-64"
    : height === "tall"
      ? "h-[34rem]"
      : height === "viewport"
        ? "h-[70vh]"
        : "h-96";
}
function downloadChart(chart: import("echarts").ECharts | null, title: string) {
  if (!chart) return;
  const link = document.createElement("a");
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  link.href = chart.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#080d14" });
  link.click();
}
