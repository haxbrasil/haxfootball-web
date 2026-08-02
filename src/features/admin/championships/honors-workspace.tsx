import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  Ellipsis,
  Gauge,
  GitBranch,
  GripVertical,
  Medal,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trophy,
  UserRoundCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatMetricLabel } from "#/lib/stats-metrics/labels";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Textarea } from "#/components/ui/textarea";
import type {
  ChampionshipHonorData,
  ChampionshipHonorDefinitionsData,
  ChampionshipHonorResolutionPreviewData,
  ChampionshipHonorsData,
  ChampionshipWorkspaceData,
} from "#/server/api/championship-api";
import {
  createChampionshipHonorFn,
  createChampionshipHonorGrantFn,
  previewChampionshipHonorResolutionFn,
  revokeChampionshipHonorGrantFn,
  resolveChampionshipHonorFn,
  reorderChampionshipHonorsFn,
  updateChampionshipHonorFn,
} from "#/server/api/championship-honor-functions";

type HonorData = Pick<
  ChampionshipWorkspaceData,
  "championship" | "teams" | "participants" | "format"
> & {
  honors: ChampionshipHonorsData;
  honorDefinitions?: ChampionshipHonorDefinitionsData;
  accounts?: ChampionshipWorkspaceData["accounts"];
};
type RecipientType = ChampionshipHonorData["definition"]["recipientTypes"][number];
type DecisionPolicy =
  | { type: "placement"; ranks: number[] }
  | {
      type: "spot-result";
      spotUuids: string[];
      outcome: "winner" | "loser" | "occupant";
    }
  | {
      type: "metric-ranking";
      metricKey: string;
      direction: "highest" | "lowest";
      limit: number;
    }
  | { type: "staff-selection" }
  | { type: "hybrid"; note: string };
type PolicyType = DecisionPolicy["type"];

export function ChampionshipHonorsWorkspace({
  data,
  mode,
}: {
  data: HonorData;
  mode: "admin" | "public";
}) {
  const router = useRouter();
  const reorderHonors = useServerFn(reorderChampionshipHonorsFn);
  const workspaceRef = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState<ChampionshipHonorData | null | undefined>();
  const [awarding, setAwarding] = useState<ChampionshipHonorData | null>(null);
  const [resolving, setResolving] = useState<ChampionshipHonorData | null>(null);
  const [orderedUuids, setOrderedUuids] = useState(() =>
    activeHonorUuids(data.honors.items),
  );
  const [reordering, setReordering] = useState(false);
  useEffect(() => {
    setOrderedUuids(activeHonorUuids(data.honors.items));
  }, [data.honors.items]);
  const honorByUuid = new Map(data.honors.items.map((honor) => [honor.uuid, honor]));
  const active = orderedUuids
    .map((uuid) => honorByUuid.get(uuid))
    .filter((honor): honor is ChampionshipHonorData => Boolean(honor && honor.state !== "void"));
  const inDispute = active.filter((honor) => honor.state !== "awarded");
  const awarded = active.filter((honor) => honor.state === "awarded");

  async function persistOrder(next: ChampionshipHonorData[]) {
    if (reordering || next.every((honor, index) => honor.uuid === active[index]?.uuid)) return;
    const previous = orderedUuids;
    const nextUuids = next.map((honor) => honor.uuid);
    setOrderedUuids(nextUuids);
    setReordering(true);
    try {
      const result = await reorderHonors({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(data.championship.revision),
          honorUuids: nextUuids,
        },
      });
      if (!result.ok) {
        setOrderedUuids(previous);
        return toast.error(result.message);
      }
      await router.invalidate();
    } catch (cause) {
      setOrderedUuids(previous);
      toast.error(errorMessage(cause));
    } finally {
      setReordering(false);
    }
  }

  function moveHonor(honorUuid: string, direction: -1 | 1) {
    const section = inDispute.some((honor) => honor.uuid === honorUuid) ? inDispute : awarded;
    const from = section.findIndex((honor) => honor.uuid === honorUuid);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= section.length) return;
    const nextSection = [...section];
    const [moving] = nextSection.splice(from, 1);
    nextSection.splice(to, 0, moving!);
    void persistOrder(
      section === inDispute ? [...nextSection, ...awarded] : [...inDispute, ...nextSection],
    );
  }

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || mode !== "admin") return;
    const cleanups = [
      monitorForElements({
        onDrop({ source, location }) {
          if (source.data.type !== "championship-honor" || reordering) return;
          const sourceUuid = source.data.honorUuid;
          const target = location.current.dropTargets[0];
          const targetUuid = target?.data.honorUuid;
          if (
            typeof sourceUuid !== "string" ||
            typeof targetUuid !== "string" ||
            sourceUuid === targetUuid ||
            source.data.section !== target.data.section
          ) {
            return;
          }
          const section = source.data.section === "awarded" ? awarded : inDispute;
          const nextSection = reorderHonorItems(section, sourceUuid, targetUuid);
          void persistOrder(
            source.data.section === "awarded"
              ? [...inDispute, ...nextSection]
              : [...nextSection, ...awarded],
          );
        },
      }),
    ];
    for (const row of workspace.querySelectorAll<HTMLElement>("[data-honor-row]")) {
      const honorUuid = row.dataset.honorRow;
      const section = row.dataset.honorSection;
      const handle = row.querySelector<HTMLElement>("[data-honor-drag-handle]");
      if (!honorUuid || !section || !handle) continue;
      cleanups.push(
        combine(
          draggable({
            element: row,
            dragHandle: handle,
            getInitialData: () => ({ type: "championship-honor", honorUuid, section }),
            onDragStart: () => row.setAttribute("data-dragging", "true"),
            onDrop: () => row.removeAttribute("data-dragging"),
          }),
          dropTargetForElements({
            element: row,
            getData: () => ({ type: "championship-honor", honorUuid, section }),
            getIsSticky: () => true,
          }),
        ),
      );
    }
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [active, awarded, inDispute, mode, reordering]);

  return (
    <section ref={workspaceRef} className="bfl-panel overflow-hidden rounded-lg border">
      <header className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="font-semibold">Conquistas da edição</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Títulos e prêmios anunciados, em decisão e já concedidos.
          </p>
        </div>
        {mode === "admin" ? (
          <Button onClick={() => setEditing(null)} disabled={!publishedDefinitions(data).length}>
            <Plus /> Colocar em disputa
          </Button>
        ) : null}
      </header>

      {active.length ? (
        <div>
          {inDispute.length ? (
            <HonorSection
              eyebrow="Em disputa"
              items={inDispute}
              data={data}
              mode={mode}
              onEdit={setEditing}
              onAward={setAwarding}
              onResolve={setResolving}
              onMove={moveHonor}
              reordering={reordering}
            />
          ) : null}
          {awarded.length ? (
            <HonorSection
              eyebrow="Conquistas confirmadas"
              items={awarded}
              data={data}
              mode={mode}
              onEdit={setEditing}
              onAward={setAwarding}
              onResolve={setResolving}
              onMove={moveHonor}
              reordering={reordering}
            />
          ) : null}
        </div>
      ) : (
        <div className="px-6 py-16 text-center">
          <Trophy className="mx-auto size-9 text-muted-foreground" />
          <p className="mt-4 font-medium">
            {mode === "admin" ? "Defina o que está em disputa" : "Conquistas serão anunciadas aqui"}
          </p>
          <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
            {mode === "admin"
              ? "Use uma definição publicada do catálogo para anunciar um título ou prêmio nesta edição."
              : "A organização pode apresentar títulos e prêmios antes da definição dos vencedores."}
          </p>
        </div>
      )}

      {editing !== undefined && mode === "admin" ? (
        <HonorDialog data={data} honor={editing} onClose={() => setEditing(undefined)} />
      ) : null}
      {awarding && mode === "admin" ? (
        <GrantDialog data={data} honor={awarding} onClose={() => setAwarding(null)} />
      ) : null}
      {resolving && mode === "admin" ? (
        <ResolutionDialog data={data} honor={resolving} onClose={() => setResolving(null)} />
      ) : null}
    </section>
  );
}

function HonorSection({
  eyebrow,
  items,
  data,
  mode,
  onEdit,
  onAward,
  onResolve,
  onMove,
  reordering,
}: {
  eyebrow: string;
  items: ChampionshipHonorData[];
  data: HonorData;
  mode: "admin" | "public";
  onEdit: (honor: ChampionshipHonorData) => void;
  onAward: (honor: ChampionshipHonorData) => void;
  onResolve: (honor: ChampionshipHonorData) => void;
  onMove: (honorUuid: string, direction: -1 | 1) => void;
  reordering: boolean;
}) {
  return (
    <div className="border-b last:border-b-0">
      <div className="border-b bg-muted/15 px-5 py-2.5 text-xs font-semibold uppercase text-muted-foreground">
        {eyebrow}
      </div>
      <div className="divide-y">
        {items.map((honor, index) => (
          <HonorRow
            key={honor.uuid}
            honor={honor}
            data={data}
            mode={mode}
            onEdit={() => onEdit(honor)}
            onAward={() => onAward(honor)}
            onResolve={() => onResolve(honor)}
            onMove={(direction) => onMove(honor.uuid, direction)}
            canMoveUp={index > 0}
            canMoveDown={index < items.length - 1}
            reordering={reordering}
          />
        ))}
      </div>
    </div>
  );
}

function HonorRow({
  honor,
  data,
  mode,
  onEdit,
  onAward,
  onResolve,
  onMove,
  canMoveUp,
  canMoveDown,
  reordering,
}: {
  honor: ChampionshipHonorData;
  data: HonorData;
  mode: "admin" | "public";
  onEdit: () => void;
  onAward: () => void;
  onResolve: () => void;
  onMove: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  reordering: boolean;
}) {
  const router = useRouter();
  const update = useServerFn(updateChampionshipHonorFn);
  const revoke = useServerFn(revokeChampionshipHonorGrantFn);
  const Icon = honor.kind === "title" ? Crown : Award;
  const activeGrants = honor.grants.filter((grant) => !grant.revokedAt);

  async function transition(state: "announced" | "deciding" | "void") {
    const result = await update({
      data: {
        championshipUuid: data.championship.uuid,
        honorUuid: honor.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: Number(data.championship.revision),
        state,
        reason:
          state === "void"
            ? "Conquista retirada desta edição"
            : "Etapa atualizada pela organização",
      },
    });
    if (!result.ok) return toast.error(result.message);
    toast.success(state === "void" ? "Conquista anulada." : "Etapa atualizada.");
    await router.invalidate();
  }

  async function revokeGrant(grantUuid: string) {
    const result = await revoke({
      data: {
        championshipUuid: data.championship.uuid,
        honorUuid: honor.uuid,
        grantUuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: Number(data.championship.revision),
        reason: "Correção da premiação pela organização",
      },
    });
    if (!result.ok) return toast.error(result.message);
    toast.success("Concessão revogada.");
    await router.invalidate();
  }

  return (
    <article
      data-honor-row={honor.uuid}
      data-honor-section={honor.state === "awarded" ? "awarded" : "in-dispute"}
      className="grid gap-4 px-5 py-5 transition-opacity data-[dragging=true]:opacity-45 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.75fr)_auto] lg:items-center"
    >
      <div className="flex min-w-0 items-start gap-4">
        {mode === "admin" ? (
          <button
            type="button"
            data-honor-drag-handle
            className="mt-2 grid size-7 shrink-0 cursor-grab place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
            aria-label={`Reordenar ${honor.name}`}
            title="Arraste para reordenar"
            disabled={reordering}
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}
        <span className="grid size-11 shrink-0 place-items-center rounded-md border bg-muted/30 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{honor.name}</h4>
            <Badge variant="outline">{honorStateLabel(honor.state)}</Badge>
          </div>
          {honor.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{honor.description}</p>
          ) : null}
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {policyIcon(honor.decisionPolicy.type)} {policyLabel(honor.decisionPolicy)}
          </p>
        </div>
      </div>

      <div>
        {activeGrants.length ? (
          <div className="flex flex-wrap gap-2">
            {activeGrants.map((grant) => (
              <span
                key={grant.uuid}
                className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium"
              >
                <Medal className="size-4 text-amber-300" />
                {grant.displayLabel}
                {mode === "admin" ? (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => void revokeGrant(grant.uuid)}
                    aria-label={`Revogar concessão de ${grant.displayLabel}`}
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {honor.state === "draft" ? "Preparação pela organização" : "Vencedor a definir"}
          </span>
        )}
      </div>

      {mode === "admin" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label={`Ações de ${honor.name}`}>
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil /> Configurar
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canMoveUp || reordering} onSelect={() => onMove(-1)}>
              <ChevronUp /> Mover para cima
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canMoveDown || reordering} onSelect={() => onMove(1)}>
              <ChevronDown /> Mover para baixo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {honor.state === "draft" ? (
              <DropdownMenuItem onSelect={() => void transition("announced")}>
                <Send /> Anunciar
              </DropdownMenuItem>
            ) : null}
            {honor.state === "announced" ? (
              <DropdownMenuItem onSelect={() => void transition("deciding")}>
                <UserRoundCheck /> Abrir decisão
              </DropdownMenuItem>
            ) : null}
            {honor.state !== "void" &&
            activeGrants.length < Number(honor.definition.maximumRecipients) ? (
              honor.decisionPolicy.type === "staff-selection" ||
              honor.decisionPolicy.type === "hybrid" ? (
                <DropdownMenuItem onSelect={onAward}>
                  <Award /> Confirmar vencedor
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={onResolve}>
                  <Check /> Revisar resultado calculado
                </DropdownMenuItem>
              )
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => void transition("void")}>
              <X /> Anular nesta edição
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </article>
  );
}

function HonorDialog({
  data,
  honor,
  onClose,
}: {
  data: HonorData;
  honor: ChampionshipHonorData | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const create = useServerFn(createChampionshipHonorFn);
  const update = useServerFn(updateChampionshipHonorFn);
  const definitions = publishedDefinitions(data);
  const [definitionVersionUuid, setDefinitionVersionUuid] = useState(
    honor?.definition.versionUuid ?? definitions[0]?.versions[0]?.uuid ?? "",
  );
  const [policyType, setPolicyType] = useState<PolicyType>(
    honor?.decisionPolicy.type ?? "staff-selection",
  );
  const [busy, setBusy] = useState(false);
  const selectedDefinition = definitions.find((definition) =>
    definition.versions.some((version) => version.uuid === definitionVersionUuid),
  );
  const selectedVersion = selectedDefinition?.versions.find(
    (version) => version.uuid === definitionVersionUuid,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const policy = readPolicy(form, policyType);
    setBusy(true);
    try {
      const result = honor
        ? await update({
            data: {
              championshipUuid: data.championship.uuid,
              honorUuid: honor.uuid,
              commandUuid: crypto.randomUUID(),
              expectedRevision: Number(data.championship.revision),
              nameOverride: nullableText(form.get("nameOverride")),
              descriptionOverride: nullableText(form.get("descriptionOverride")),
              decisionPolicy: policy,
              reason: "Configuração da conquista atualizada",
            },
          })
        : await create({
            data: {
              championshipUuid: data.championship.uuid,
              commandUuid: crypto.randomUUID(),
              expectedRevision: Number(data.championship.revision),
              definitionVersionUuid,
              state: form.get("announce") === "on" ? "announced" : "draft",
              nameOverride: nullableText(form.get("nameOverride")),
              descriptionOverride: nullableText(form.get("descriptionOverride")),
              decisionPolicy: policy,
              displayOrder: data.honors.items.length,
            },
          });
      if (!result.ok) return toast.error(result.message);
      toast.success(honor ? "Conquista atualizada." : "Conquista adicionada à edição.");
      onClose();
      await router.invalidate();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {honor ? "Configurar conquista" : "Colocar conquista em disputa"}
          </DialogTitle>
          <DialogDescription>
            Escolha o significado publicado e defina como o resultado será decidido nesta edição.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          {!honor ? (
            <Field label="Título ou prêmio">
              <NativeSelect
                value={definitionVersionUuid}
                onChange={(event) => setDefinitionVersionUuid(event.target.value)}
                required
              >
                {definitions.flatMap((definition) =>
                  definition.versions.slice(0, 1).map((version) => (
                    <NativeSelectOption key={version.uuid} value={version.uuid}>
                      {version.name}
                    </NativeSelectOption>
                  )),
                )}
              </NativeSelect>
            </Field>
          ) : null}

          {selectedVersion ? (
            <div className="rounded-md border bg-muted/20 p-4 text-sm">
              <div className="font-medium">{selectedVersion.name}</div>
              <div className="mt-1 text-muted-foreground">
                {selectedVersion.description ?? "Definição publicada"}
              </div>
            </div>
          ) : null}

          <Field label="Nome nesta edição">
            <Input
              name="nameOverride"
              placeholder="Usar nome do catálogo"
              defaultValue={honor?.name ?? ""}
            />
          </Field>
          <Field label="Descrição nesta edição">
            <Textarea
              name="descriptionOverride"
              rows={2}
              placeholder="Usar descrição do catálogo"
              defaultValue={honor?.description ?? ""}
            />
          </Field>
          <Field label="Forma de decisão">
            <NativeSelect
              value={policyType}
              onChange={(event) => setPolicyType(event.target.value as PolicyType)}
            >
              <NativeSelectOption value="staff-selection">
                Escolha da organização
              </NativeSelectOption>
              <NativeSelectOption value="placement">Colocação final</NativeSelectOption>
              <NativeSelectOption value="spot-result">
                Resultado de spot ou chave
              </NativeSelectOption>
              <NativeSelectOption value="metric-ranking">Ranking de estatística</NativeSelectOption>
              <NativeSelectOption value="hybrid">Critério combinado</NativeSelectOption>
            </NativeSelect>
          </Field>
          <PolicyFields type={policyType} honor={honor} data={data} />
          {!honor ? (
            <label htmlFor="announce-honor" className="flex items-start gap-3 rounded-md border p-4">
              <input id="announce-honor" aria-label="Anunciar ao público agora" name="announce" type="checkbox" defaultChecked />
              <span>
                <span className="block text-sm font-medium">Anunciar ao público agora</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  A conquista aparece como em disputa, mesmo sem vencedor.
                </span>
              </span>
            </label>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || (!honor && !definitionVersionUuid)}>
              <Check /> {busy ? "Salvando" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PolicyFields({
  type,
  honor,
  data,
}: {
  type: PolicyType;
  honor: ChampionshipHonorData | null;
  data: HonorData;
}) {
  if (type === "placement") {
    const current =
      honor?.decisionPolicy.type === "placement" ? honor.decisionPolicy.ranks.join(", ") : "1";
    return (
      <Field label="Colocações que recebem">
        <Input name="ranks" defaultValue={current} placeholder="1, 2, 3" />
      </Field>
    );
  }
  if (type === "spot-result") {
    const current =
      honor?.decisionPolicy.type === "spot-result" ? honor.decisionPolicy.spotUuids : [];
    return (
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_190px]">
        <Field label="Spot da competição">
          <NativeSelect
            name="spotUuid"
            defaultValue={current[0] ?? data.format.spots.items[0]?.uuid ?? ""}
          >
            {data.format.spots.items.map((spot) => (
              <NativeSelectOption key={spot.uuid} value={spot.uuid}>
                {spot.label ?? spot.key}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Resultado usado">
          <NativeSelect
            name="outcome"
            defaultValue={
              honor?.decisionPolicy.type === "spot-result"
                ? honor.decisionPolicy.outcome
                : "occupant"
            }
          >
            <NativeSelectOption value="occupant">Ocupante do spot</NativeSelectOption>
            <NativeSelectOption value="winner">Vencedor</NativeSelectOption>
            <NativeSelectOption value="loser">Perdedor</NativeSelectOption>
          </NativeSelect>
        </Field>
      </div>
    );
  }
  if (type === "metric-ranking") {
    const policy = honor?.decisionPolicy.type === "metric-ranking" ? honor.decisionPolicy : null;
    return (
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_170px_110px]">
        <Field label="Estatística">
          <Input
            name="metricKey"
            required
            defaultValue={policy?.metricKey ?? ""}
            placeholder="Identificador da estatística"
          />
        </Field>
        <Field label="Ordenação">
          <NativeSelect name="direction" defaultValue={policy?.direction ?? "highest"}>
            <NativeSelectOption value="highest">Maior valor</NativeSelectOption>
            <NativeSelectOption value="lowest">Menor valor</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field label="Vencedores">
          <Input name="limit" type="number" min={1} max={128} defaultValue={policy?.limit ?? 1} />
        </Field>
      </div>
    );
  }
  if (type === "hybrid") {
    return (
      <Field label="Critério combinado">
        <Textarea
          name="policyNote"
          required
          rows={3}
          defaultValue={honor?.decisionPolicy.type === "hybrid" ? honor.decisionPolicy.note : ""}
        />
      </Field>
    );
  }
  return null;
}

function ResolutionDialog({
  data,
  honor,
  onClose,
}: {
  data: HonorData;
  honor: ChampionshipHonorData;
  onClose: () => void;
}) {
  const router = useRouter();
  const previewResolution = useServerFn(previewChampionshipHonorResolutionFn);
  const resolve = useServerFn(resolveChampionshipHonorFn);
  const [preview, setPreview] = useState<ChampionshipHonorResolutionPreviewData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void previewResolution({
      data: { championshipUuid: data.championship.uuid, honorUuid: honor.uuid },
    })
      .then((result) => active && setPreview(result))
      .catch((cause) => active && setLoadError(errorMessage(cause)));
    return () => {
      active = false;
    };
  }, [data.championship.uuid, honor.uuid, previewResolution]);

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
    setBusy(true);
    try {
      const result = await resolve({
        data: {
          championshipUuid: data.championship.uuid,
          honorUuid: honor.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(data.championship.revision),
          reason,
        },
      });
      if (!result.ok) return toast.error(result.message);
      toast.success("Resultado confirmado e publicado.");
      onClose();
      await router.invalidate();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar resultado</DialogTitle>
          <DialogDescription>
            Confira quem receberá {honor.name} antes de publicar o resultado.
          </DialogDescription>
        </DialogHeader>
        {!preview && !loadError ? (
          <div className="space-y-3 py-3" aria-label="Calculando resultado">
            <div className="h-16 animate-pulse rounded-md bg-muted/55" />
            <div className="h-16 animate-pulse rounded-md bg-muted/35" />
          </div>
        ) : loadError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {loadError}
          </div>
        ) : preview ? (
          <form className="space-y-5" onSubmit={confirm}>
            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm font-medium">{preview.explanation}</p>
              {preview.blockers.length ? (
                <ul className="mt-3 space-y-1 text-sm text-amber-300">
                  {preview.blockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            {preview.contenders.length ? (
              <div className="overflow-hidden rounded-md border">
                <div className="grid grid-cols-[56px_minmax(0,1fr)_auto] border-b bg-muted/25 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  <span>#</span>
                  <span>Vencedor</span>
                  <span>Base</span>
                </div>
                {preview.contenders.map((contender) => (
                  <div
                    key={`${contender.target.type}:${contender.target.uuid}`}
                    className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center border-b px-4 py-3 last:border-b-0"
                  >
                    <span className="font-semibold">{contender.rank}</span>
                    <span className="font-medium">{contender.displayLabel}</span>
                    <span className="text-sm text-muted-foreground">
                      {contender.value === null
                        ? "Resultado oficial"
                        : formatNumber(contender.value)}
                      {contender.tied ? " · empate" : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            <Field label="Motivo da confirmação">
              <Textarea
                name="reason"
                required
                minLength={3}
                rows={2}
                defaultValue="Resultado calculado conferido pela organização"
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy || !preview.ready}>
                <Check /> {busy ? "Publicando" : "Confirmar resultado"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function GrantDialog({
  data,
  honor,
  onClose,
}: {
  data: HonorData;
  honor: ChampionshipHonorData;
  onClose: () => void;
}) {
  const router = useRouter();
  const grant = useServerFn(createChampionshipHonorGrantFn);
  const [type, setType] = useState<RecipientType>(honor.definition.recipientTypes[0]!);
  const [busy, setBusy] = useState(false);
  const options = useMemo(() => targetOptions(data, type), [data, type]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const result = await grant({
        data: {
          championshipUuid: data.championship.uuid,
          honorUuid: honor.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(data.championship.revision),
          target: { type, uuid: String(form.get("targetUuid") ?? "") },
          rank: optionalInteger(form.get("rank")),
          note: nullableText(form.get("note")),
          reason: String(form.get("reason") ?? ""),
        },
      });
      if (!result.ok) return toast.error(result.message);
      toast.success("Vencedor confirmado.");
      onClose();
      await router.invalidate();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar vencedor</DialogTitle>
          <DialogDescription>
            {honor.name} · a concessão entra imediatamente no histórico público.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Tipo de vencedor">
            <NativeSelect
              value={type}
              onChange={(event) => setType(event.target.value as RecipientType)}
            >
              {honor.definition.recipientTypes.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {recipientTypeLabel(value)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Vencedor">
            <NativeSelect name="targetUuid" required>
              {options.map((option) => (
                <NativeSelectOption key={option.uuid} value={option.uuid}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
            <Field label="Posição">
              <Input name="rank" type="number" min={1} />
            </Field>
            <Field label="Observação">
              <Input name="note" />
            </Field>
          </div>
          <Field label="Motivo da confirmação">
            <Textarea
              name="reason"
              required
              minLength={3}
              rows={2}
              placeholder="Ex.: resultado oficial confirmado"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || options.length === 0}>
              <Award /> {busy ? "Confirmando" : "Confirmar vencedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function readPolicy(form: FormData, type: PolicyType): DecisionPolicy {
  if (type === "placement")
    return {
      type,
      ranks: String(form.get("ranks") ?? "1")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0),
    };
  if (type === "spot-result")
    return {
      type,
      spotUuids: [String(form.get("spotUuid") ?? "")],
      outcome: String(form.get("outcome") ?? "occupant") as "winner" | "loser" | "occupant",
    };
  if (type === "metric-ranking")
    return {
      type,
      metricKey: String(form.get("metricKey") ?? ""),
      direction: String(form.get("direction") ?? "highest") as "highest" | "lowest",
      limit: Number(form.get("limit") ?? 1),
    };
  if (type === "hybrid") return { type, note: String(form.get("policyNote") ?? "") };
  return { type: "staff-selection" };
}

function targetOptions(data: HonorData, type: RecipientType) {
  if (type === "team")
    return data.teams.items.map((team) => ({ uuid: team.uuid, label: team.name }));
  if (type === "team-identity")
    return data.teams.items
      .filter((team) => team.teamIdentity)
      .map((team) => ({ uuid: team.teamIdentity!.uuid, label: team.teamIdentity!.name }));
  if (type === "participant")
    return data.participants.items.map((participant) => ({
      uuid: participant.uuid,
      label: participant.displayName,
    }));
  if (type === "historical-player")
    return data.participants.items
      .filter((participant) => participant.identity.kind === "historical")
      .map((participant) => ({
        uuid:
          participant.identity.kind === "historical"
            ? participant.identity.historicalIdentityUuid
            : participant.uuid,
        label: participant.displayName,
      }));
  return (data.accounts?.items ?? []).map((account) => ({
    uuid: account.uuid,
    label: account.name,
  }));
}

function publishedDefinitions(data: HonorData) {
  return (data.honorDefinitions?.items ?? []).filter(
    (definition) =>
      definition.state === "active" &&
      definition.versions.length > 0 &&
      definition.competitionType.uuid === data.championship.competitionType.uuid,
  );
}

function activeHonorUuids(items: ChampionshipHonorData[]) {
  return items
    .filter((honor) => honor.state !== "void")
    .sort((left, right) => Number(left.displayOrder) - Number(right.displayOrder))
    .map((honor) => honor.uuid);
}

export function reorderHonorItems(
  items: ChampionshipHonorData[],
  sourceUuid: string,
  targetUuid: string,
) {
  const from = items.findIndex((honor) => honor.uuid === sourceUuid);
  const to = items.findIndex((honor) => honor.uuid === targetUuid);
  if (from < 0 || to < 0 || from === to) return items;
  const reordered = [...items];
  const [moving] = reordered.splice(from, 1);
  reordered.splice(to, 0, moving!);
  return reordered;
}

function honorStateLabel(state: ChampionshipHonorData["state"]) {
  return (
    {
      draft: "Em preparação",
      announced: "Em disputa",
      deciding: "Em decisão",
      awarded: "Concedido",
      void: "Anulado",
    } as const
  )[state];
}

function recipientTypeLabel(type: RecipientType) {
  return (
    {
      participant: "Participante",
      team: "Equipe",
      "team-identity": "Identidade de equipe",
      account: "Conta",
      "historical-player": "Jogador histórico",
    } as const
  )[type];
}

function policyLabel(policy: ChampionshipHonorData["decisionPolicy"] | DecisionPolicy) {
  if (policy.type === "placement") return `Colocações ${policy.ranks.join(", ")}`;
  if (policy.type === "spot-result") return "Resultado da competição";
  if (policy.type === "metric-ranking")
    return `${policy.direction === "highest" ? "Maior" : "Menor"} ${formatMetricLabel(policy.metricKey).toLowerCase()}`;
  if (policy.type === "hybrid") return policy.note;
  return "Escolha da organização";
}

function policyIcon(type: PolicyType) {
  if (type === "placement") return <Trophy className="size-3.5" />;
  if (type === "spot-result") return <GitBranch className="size-3.5" />;
  if (type === "metric-ranking") return <Gauge className="size-3.5" />;
  return <UserRoundCheck className="size-3.5" />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function optionalInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return value && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function nullableText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim() || null;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "Não foi possível concluir a operação.";
}
