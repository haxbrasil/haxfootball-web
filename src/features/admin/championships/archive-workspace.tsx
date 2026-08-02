import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Archive, Award, Check, Crown, Medal, Plus, Save, Sparkles, Trophy } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { EntityPicker } from "#/components/ds/forms/entity-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Textarea } from "#/components/ui/textarea";
import type {
  ChampionshipHistoryData,
  ChampionshipWorkspaceData,
} from "#/server/api/championship-api";
import {
  createChampionshipAwardFn,
  replaceChampionshipPlacementsFn,
  updateChampionshipAwardFn,
} from "#/server/api/championship-functions";
import { ChampionshipHonorsWorkspace } from "./honors-workspace";

type ArchiveData = Pick<
  ChampionshipWorkspaceData,
  "championship" | "teams" | "participants" | "format" | "honors"
> & {
  history: ChampionshipHistoryData;
  honorDefinitions?: ChampionshipWorkspaceData["honorDefinitions"];
};
type ArchiveDataWithAccounts = ArchiveData & {
  accounts?: ChampionshipWorkspaceData["accounts"];
};
type PlacementDraft = { rank: number; teamUuid: string };
type AwardTargetType = ChampionshipHistoryData["awards"]["items"][number]["target"]["type"];

export function ChampionshipArchiveWorkspace({
  data,
  mode,
}: {
  data: ArchiveDataWithAccounts;
  mode: "admin" | "public";
}) {
  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Títulos e prêmios</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Conquistas em disputa, resultados confirmados e classificação final.
          </p>
        </div>
        {data.championship.lifecycle === "completed" ||
        data.championship.lifecycle === "archived" ? (
          <Badge variant="outline" className="border-emerald-400/50 text-emerald-300">
            <Check />
            Registro concluído
          </Badge>
        ) : null}
      </header>

      {mode === "admin" || data.honors.items.length ? (
        <ChampionshipHonorsWorkspace data={data} mode={mode} />
      ) : null}

      {data.history.awards.items.length ? <AwardLedger data={data} mode={mode} /> : null}

      <div className="grid items-start gap-7">
        {mode === "admin" ? (
          <PlacementEditor data={data} />
        ) : (
          <PlacementLedger history={data.history} />
        )}
      </div>
    </div>
  );
}

function PlacementEditor({ data }: { data: ArchiveDataWithAccounts }) {
  const replace = useServerFn(replaceChampionshipPlacementsFn);
  const router = useRouter();
  const [drafts, setDrafts] = useState<PlacementDraft[]>(() =>
    data.history.placements.items.map(({ rank, team }) => ({
      rank: Number(rank),
      teamUuid: team.uuid,
    })),
  );
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const sorted = [...drafts].sort((left, right) => left.rank - right.rank);
  const availableTeams = data.teams.items.filter(
    (team) => !drafts.some((draft) => draft.teamUuid === team.uuid),
  );

  async function save() {
    setBusy(true);
    try {
      const result = await replace({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(data.championship.revision),
          placements: sorted,
          reason,
        },
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Colocações registradas.");
      await router.invalidate();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function addPlacement() {
    const team = availableTeams[0];
    if (!team) return;
    const usedRanks = new Set(drafts.map(({ rank }) => rank));
    let rank = 1;
    while (usedRanks.has(rank)) rank += 1;
    setDrafts((current) => [...current, { rank, teamUuid: team.uuid }]);
  }

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center border bg-muted/30 text-primary">
            <Trophy className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Colocações oficiais</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Defina a classificação final da edição.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={availableTeams.length === 0}
          onClick={addPlacement}
        >
          <Plus />
          Posição
        </Button>
      </div>
      <div className="divide-y">
        {sorted.map((draft) => (
          <div
            key={draft.teamUuid}
            className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
          >
            <Input
              type="number"
              min={1}
              aria-label={`Posição de ${teamLabel(data, draft.teamUuid)}`}
              className="h-9 text-center font-mono"
              value={draft.rank}
              onChange={(event) =>
                setDrafts((current) =>
                  current.map((item) =>
                    item.teamUuid === draft.teamUuid
                      ? {
                          ...item,
                          rank: Math.max(1, Number(event.target.value)),
                        }
                      : item,
                  ),
                )
              }
            />
            <NativeSelect
              aria-label={`Equipe da posição ${draft.rank}`}
              value={draft.teamUuid}
              onChange={(event) =>
                setDrafts((current) =>
                  current.map((item) =>
                    item.teamUuid === draft.teamUuid
                      ? { ...item, teamUuid: event.target.value }
                      : item,
                  ),
                )
              }
            >
              {data.teams.items
                .filter(
                  (team) =>
                    team.uuid === draft.teamUuid ||
                    !drafts.some((item) => item.teamUuid === team.uuid),
                )
                .map((team) => (
                  <NativeSelectOption key={team.uuid} value={team.uuid}>
                    {team.name}
                  </NativeSelectOption>
                ))}
            </NativeSelect>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setDrafts((current) => current.filter((item) => item.teamUuid !== draft.teamUuid))
              }
            >
              Remover
            </Button>
          </div>
        ))}
        {drafts.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Adicione as equipes que terão uma colocação oficial.
          </div>
        ) : null}
      </div>
      <div className="space-y-3 border-t p-4">
        <div>
          <Label htmlFor="placement-reason">Motivo da atualização</Label>
          <Textarea
            id="placement-reason"
            className="mt-2"
            rows={2}
            placeholder="Ex.: final confirmada pela organização"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <Button
          className="w-full"
          disabled={busy || drafts.length === 0 || reason.trim().length < 3}
          onClick={save}
        >
          <Save />
          {busy ? "Registrando" : "Registrar colocações"}
        </Button>
      </div>
    </section>
  );
}

function PlacementLedger({ history }: { history: ChampionshipHistoryData }) {
  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Classificação final</h3>
      </div>
      <div className="divide-y">
        {history.placements.items.map((placement) => (
          <div
            key={placement.uuid}
            className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4"
          >
            <span className="font-mono text-xl font-semibold tabular-nums">{placement.rank}º</span>
            <div>
              <div className="font-medium">{placement.teamNameSnapshot}</div>
              {placement.identitySnapshot ? (
                <div className="text-xs text-muted-foreground">
                  {placement.identitySnapshot.name}
                </div>
              ) : null}
            </div>
            {Number(placement.rank) <= 3 ? (
              Number(placement.rank) === 1 ? (
                <Crown className="size-5 text-amber-300" />
              ) : (
                <Medal className="size-5 text-muted-foreground" />
              )
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function AwardLedger({ data, mode }: { data: ArchiveDataWithAccounts; mode: "admin" | "public" }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChampionshipHistoryData["awards"]["items"][number] | null>(
    null,
  );

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center border bg-muted/30 text-amber-300">
            <Award className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Prêmios e reconhecimentos</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Destaques oficiais da edição.</p>
          </div>
        </div>
        {mode === "admin" ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus />
            Prêmio
          </Button>
        ) : null}
      </div>
      {data.history.awards.items.length ? (
        <div className="divide-y">
          {data.history.awards.items.map((award) => (
            <button
              key={award.uuid}
              type="button"
              disabled={mode === "public"}
              className="flex w-full items-center gap-3 px-4 py-4 text-left disabled:cursor-default"
              onClick={() => {
                setEditing(award);
                setOpen(true);
              }}
            >
              <span className="flex size-9 items-center justify-center border bg-background">
                <Award className="size-4 text-amber-300" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{award.displayLabel}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {award.note ?? awardTargetLabel(award.target.type)}
                </span>
              </span>
              {award.rank ? <Badge variant="outline">{award.rank}º</Badge> : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="px-5 py-12 text-center">
          <Sparkles className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum prêmio registrado.</p>
        </div>
      )}
      {mode === "admin" ? (
        <AwardDialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setEditing(null);
          }}
          data={data}
          award={editing}
        />
      ) : null}
    </section>
  );
}

function AwardDialog({
  open,
  onOpenChange,
  data,
  award,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ArchiveDataWithAccounts;
  award: ChampionshipHistoryData["awards"]["items"][number] | null;
}) {
  const create = useServerFn(createChampionshipAwardFn);
  const update = useServerFn(updateChampionshipAwardFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const initialTargetType = award?.target.type ?? "participant";
  const [targetType, setTargetType] = useState<AwardTargetType>(initialTargetType);
  const targetOptions = useMemo(() => awardTargets(data, targetType), [data, targetType]);
  const [targetUuid, setTargetUuid] = useState(
    award?.target.type === initialTargetType ? award.target.uuid : "",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    const common = {
      championshipUuid: data.championship.uuid,
      commandUuid: crypto.randomUUID(),
      expectedRevision: Number(data.championship.revision),
      kind: String(form.get("kind") ?? ""),
      rank: optionalInteger(form.get("rank")),
      target: {
        type: targetType,
        uuid: targetUuid,
      },
      displayLabel: String(form.get("displayLabel") ?? ""),
      note: nullableText(form.get("note")),
    };
    try {
      const result = award
        ? await update({
            data: {
              ...common,
              awardUuid: award.uuid,
              reason: String(form.get("reason") ?? ""),
            },
          })
        : await create({ data: common });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(award ? "Prêmio corrigido." : "Prêmio registrado.");
      onOpenChange(false);
      await router.invalidate();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{award ? "Corrigir prêmio" : "Registrar prêmio"}</DialogTitle>
          <DialogDescription>
            O destino pode ser uma equipe, identidade, participante ou conta.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Chave">
              <Input name="kind" required defaultValue={award?.kind ?? "mvp"} />
            </Field>
            <Field label="Nome público">
              <Input name="displayLabel" required defaultValue={award?.displayLabel ?? ""} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[190px_minmax(0,1fr)]">
            <Field label="Tipo de destino">
              <NativeSelect
                value={targetType}
                onChange={(event) => {
                  setTargetType(event.target.value as AwardTargetType);
                  setTargetUuid("");
                }}
              >
                <NativeSelectOption value="participant">Participante</NativeSelectOption>
                <NativeSelectOption value="team">Equipe</NativeSelectOption>
                <NativeSelectOption value="team-identity">Identidade de equipe</NativeSelectOption>
                <NativeSelectOption value="account">Conta</NativeSelectOption>
                <NativeSelectOption value="historical-player">Jogador histórico</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field label="Destino">
              <EntityPicker
                name="targetUuid"
                value={targetUuid}
                onValueChange={setTargetUuid}
                ariaLabel="Destino do prêmio"
                placeholder="Selecionar destino"
                searchPlaceholder="Buscar destino…"
                emptyLabel="Nenhum destino disponível."
                options={targetOptions.map((option) => ({
                  value: option.uuid,
                  label: option.label,
                }))}
              />
            </Field>
          </div>
          <Field label="Colocação associada">
            <Input name="rank" type="number" min={1} defaultValue={award?.rank ?? ""} />
          </Field>
          <Field label="Observação">
            <Textarea name="note" rows={3} defaultValue={award?.note ?? ""} />
          </Field>
          {award ? (
            <Field label="Motivo da correção">
              <Textarea name="reason" required minLength={3} rows={2} />
            </Field>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || !targetUuid}>
              <Award />
              {busy ? "Registrando" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function awardTargetLabel(type: AwardTargetType) {
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

function awardTargets(data: ArchiveDataWithAccounts, type: AwardTargetType) {
  if (type === "team") {
    return data.teams.items.map((team) => ({
      uuid: team.uuid,
      label: team.name,
    }));
  }
  if (type === "team-identity") {
    return data.teams.items
      .filter((team) => team.teamIdentity)
      .map((team) => ({
        uuid: team.teamIdentity!.uuid,
        label: team.teamIdentity!.name,
      }));
  }
  if (type === "participant") {
    return data.participants.items.map((participant) => ({
      uuid: participant.uuid,
      label: participant.displayName,
    }));
  }
  if (type === "historical-player") {
    return data.participants.items
      .filter((participant) => participant.identity.kind === "historical")
      .map((participant) => ({
        uuid:
          participant.identity.kind === "historical"
            ? participant.identity.historicalIdentityUuid
            : participant.uuid,
        label: participant.displayName,
      }));
  }
  return (data.accounts?.items ?? []).map((account) => ({
    uuid: account.uuid,
    label: account.name,
  }));
}

function teamLabel(data: ArchiveDataWithAccounts, uuid: string) {
  return data.teams.items.find((team) => team.uuid === uuid)?.name ?? "equipe";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function optionalInteger(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);
  return value && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function nullableText(value: FormDataEntryValue | null): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : "Não foi possível concluir a operação.";
}
