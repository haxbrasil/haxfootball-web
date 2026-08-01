import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChartNoAxesCombined, Eye, LayoutDashboard, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Skeleton } from "#/components/ui/skeleton";
import { cn } from "#/lib/utils";
import {
  getChampionshipVisualizationConfigurationFn,
  upsertChampionshipVisualizationFn,
} from "#/server/api/championship-visualization-functions";

type Instance = {
  id: string;
  surface: "overview" | "statistics";
  displayOrder: number;
  width: "compact" | "half" | "full";
  height: "short" | "medium" | "tall" | "viewport";
  visibility: "draft" | "published";
  revision: number;
  template: { title: string; templateVersionId: number; version: number };
};
type Configuration = {
  templates: Array<{
    id: string;
    title: string;
    description: string | null;
    version: number;
    templateVersionId: number;
  }>;
  instances: Instance[];
};

export function ChampionshipVisualizationWorkspace({ championshipId }: { championshipId: string }) {
  const [data, setData] = useState<Configuration | null>(null);
  const [selected, setSelected] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [surface, setSurface] = useState<"overview" | "statistics">("statistics");
  const load = async () => {
    const next = (await getChampionshipVisualizationConfigurationFn({
      data: { championshipId },
    })) as Configuration;
    setData(next);
    setSelected((current) => current || next.templates[0]?.templateVersionId.toString() || "");
  };
  useEffect(() => {
    void load();
  }, [championshipId]);
  if (!data)
    return (
      <div className="space-y-3 border p-5">
        <Skeleton className="h-7 w-64 bg-neutral-800" />
        <Skeleton className="h-32 bg-neutral-800" />
      </div>
    );
  const mutate = async (item: Instance, patch: Partial<Instance>) => {
    const result = await upsertChampionshipVisualizationFn({
      data: {
        championshipId,
        uuid: item.id,
        templateVersionId: item.template.templateVersionId,
        surface: item.surface,
        displayOrder: item.displayOrder,
        width: patch.width ?? item.width,
        height: patch.height ?? item.height,
        visibility: patch.visibility ?? item.visibility,
        expectedRevision: item.revision,
      },
    });
    if (result.ok) {
      toast.success("Layout atualizado");
      await load();
    } else toast.error(result.message);
  };
  const add = async (surface: "overview" | "statistics") => {
    const template = data.templates.find((item) => item.templateVersionId === Number(selected));
    if (!template) return;
    const result = await upsertChampionshipVisualizationFn({
      data: {
        championshipId,
        templateVersionId: template.templateVersionId,
        surface,
        displayOrder: data.instances.filter((item) => item.surface === surface).length,
        width: "half",
        height: "medium",
        visibility: "published",
      },
    });
    if (result.ok) {
      toast.success("Visualização adicionada");
      setAddOpen(false);
      await load();
    } else toast.error(result.message);
  };
  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <header className="flex flex-col gap-5 border-b bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ChartNoAxesCombined className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Adicionar visualizações</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha um modelo publicado e decida onde ele aparecerá para jogadores e equipes.
          </p>
        </div>
        {data.templates.length ? (
          <Button onClick={() => setAddOpen(true)}>
            <Plus /> Adicionar visualização
          </Button>
        ) : null}
      </header>
      {data.templates.length ? (
        <div className="grid divide-y xl:grid-cols-2 xl:divide-x xl:divide-y-0">
          <PlacementColumn
            title="Visão geral"
            items={data.instances.filter((item) => item.surface === "overview")}
            onChange={mutate}
          />
          <PlacementColumn
            title="Estatísticas"
            items={data.instances.filter((item) => item.surface === "statistics")}
            onChange={mutate}
          />
        </div>
      ) : (
        <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
          <div className="max-w-md">
            <div className="mx-auto grid size-11 place-items-center border bg-background/40 text-primary">
              <ChartNoAxesCombined className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">Nenhum modelo de campeonato publicado</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Publique um modelo de visualização para poder posicioná-lo na visão geral ou nas
              estatísticas desta edição.
            </p>
            <Button asChild className="mt-5">
              <Link to="/admin/modes-statistics">Abrir estúdio de visualizações</Link>
            </Button>
          </div>
        </div>
      )}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar visualização</DialogTitle>
            <DialogDescription>
              Escolha um modelo publicado e a área em que ele será exibido nesta edição.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-1">
            <label className="grid gap-2 text-sm font-medium">
              Modelo publicado
              <NativeSelect value={selected} onChange={(event) => setSelected(event.target.value)}>
                {data.templates.map((template) => (
                  <NativeSelectOption
                    key={template.templateVersionId}
                    value={template.templateVersionId}
                  >
                    {template.title} · v{template.version}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <div className="grid gap-2">
              <span className="text-sm font-medium">Exibir em</span>
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="Área da visualização"
              >
                <button
                  type="button"
                  className={cn(
                    "flex min-h-20 flex-col items-start gap-1.5 rounded-md border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    surface === "overview"
                      ? "border-primary/70 bg-primary/15 text-foreground hover:bg-primary/20"
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/10",
                  )}
                  aria-pressed={surface === "overview"}
                  onClick={() => setSurface("overview")}
                >
                  <LayoutDashboard
                    className={surface === "overview" ? "text-primary" : "text-muted-foreground"}
                  />
                  <span className="font-medium">Visão geral</span>
                  <span
                    className={
                      surface === "overview"
                        ? "text-xs text-foreground/80"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    Destaque na página da edição.
                  </span>
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex min-h-20 flex-col items-start gap-1.5 rounded-md border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    surface === "statistics"
                      ? "border-primary/70 bg-primary/15 text-foreground hover:bg-primary/20"
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/10",
                  )}
                  aria-pressed={surface === "statistics"}
                  onClick={() => setSurface("statistics")}
                >
                  <ChartNoAxesCombined
                    className={surface === "statistics" ? "text-primary" : "text-muted-foreground"}
                  />
                  <span className="font-medium">Estatísticas</span>
                  <span
                    className={
                      surface === "statistics"
                        ? "text-xs text-foreground/80"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    Análise detalhada da edição.
                  </span>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => add(surface)}>
              <Plus /> Adicionar visualização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function PlacementColumn({
  title,
  items,
  onChange,
}: {
  title: string;
  items: Instance[];
  onChange: (item: Instance, patch: Partial<Instance>) => void;
}) {
  return (
    <div className="min-h-48 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {items.length ? (
          <span className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "visualização" : "visualizações"}
          </span>
        ) : null}
      </div>
      {items.length ? (
        <div className="divide-y border-y">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 px-3 py-3 transition-colors hover:bg-muted/25 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center border bg-muted/30 text-primary">
                  <ChartNoAxesCombined className="size-4" />
                </span>
                <div className="min-w-0">
                  <strong className="text-sm">{item.template.title}</strong>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    v{item.template.version} ·{" "}
                    {item.visibility === "published" ? "Pública" : "Rascunho"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NativeSelect
                  aria-label={`Largura de ${item.template.title}`}
                  value={item.width}
                  onChange={(event) =>
                    onChange(item, { width: event.target.value as Instance["width"] })
                  }
                >
                  <NativeSelectOption value="compact">Compacta</NativeSelectOption>
                  <NativeSelectOption value="half">Meia largura</NativeSelectOption>
                  <NativeSelectOption value="full">Largura total</NativeSelectOption>
                </NativeSelect>
                <Button
                  size="icon"
                  variant="ghost"
                  title={item.visibility === "published" ? "Ocultar" : "Publicar"}
                  onClick={() =>
                    onChange(item, {
                      visibility: item.visibility === "published" ? "draft" : "published",
                    })
                  }
                >
                  <Eye />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-32 place-items-center border border-dashed text-sm text-muted-foreground">
          Nenhuma visualização nesta área.
        </div>
      )}
    </div>
  );
}
