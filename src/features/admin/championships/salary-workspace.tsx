import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { ChampionshipRosterMovePreview } from "@haxbrasil/haxfootball-api-sdk";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  BadgeDollarSign,
  Check,
  CircleAlert,
  CircleDollarSign,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Crown,
  History,
  LockKeyhole,
  Plus,
  Save,
  Search,
  ShieldAlert,
  Settings2,
  UserRoundPlus,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { EntityPicker } from "#/components/ds/forms/entity-picker";
import { Checkbox } from "#/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Progress } from "#/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Textarea } from "#/components/ui/textarea";
import type { ChampionshipWorkspaceData } from "#/server/api/championship-api";
import { formatSalaryUnits } from "#/features/championships/salary-format";
import {
  createChampionshipParticipantFn,
  executeChampionshipRosterMoveFn,
  freezeChampionshipPricesFn,
  getChampionshipSalaryWorkspacePageFn,
  previewChampionshipRosterMoveFn,
  reorderChampionshipRosterFn,
  searchChampionshipAccountsFn,
  transitionChampionshipRegistrationFn,
  updateChampionshipParticipantFn,
  upsertChampionshipPricesFn,
} from "#/server/api/championship-functions";
import {
  parsePastedSalaryValues,
  salaryCapPercentage,
  simulateSalarySwap,
} from "./salary-workspace-model";

type SalaryParticipant = ChampionshipWorkspaceData["salary"]["participants"]["items"][number];
type SalaryTeam = ChampionshipWorkspaceData["salary"]["teams"]["items"][number];
type RosterMoveRequest = {
  participant: SalaryParticipant;
  targetTeamId: string | null;
  role: "gm" | "player";
};

export function SalaryWorkspace({
  data,
  isAdmin,
}: {
  data: ChampionshipWorkspaceData;
  isAdmin: boolean;
}) {
  const [moveRequest, setMoveRequest] = useState<RosterMoveRequest | null>(null);
  const salary = data.salary;

  return (
    <div className="space-y-7">
      <SalaryWorkspaceHeading data={data} isAdmin={isAdmin} />

      {!salary.enabled ? (
        <Alert>
          <CircleDollarSign />
          <AlertTitle>Esta edição não usa salários</AlertTitle>
          <AlertDescription>
            Inscrições, GMs e elencos continuam disponíveis normalmente. Para usar valores, teto e
            regras financeiras, ative o sistema em Configuração, Regras da edição, Teto salarial.
          </AlertDescription>
        </Alert>
      ) : null}

      <RegistrationBand data={data} isAdmin={isAdmin} />
      {salary.enabled ? (
        <ValuationGrid data={data} isAdmin={isAdmin} onMoveRequest={setMoveRequest} />
      ) : null}
      <TeamCapComparison data={data} onMoveRequest={setMoveRequest} />
      {salary.enabled ? <TradeSimulation data={data} /> : null}
      <RosterHistory data={data} />

      <RosterMoveDialog
        data={data}
        request={moveRequest}
        onOpenChange={(open) => {
          if (!open) setMoveRequest(null);
        }}
      />
    </div>
  );
}

function SalaryWorkspaceHeading({
  data,
  isAdmin,
}: {
  data: ChampionshipWorkspaceData;
  isAdmin: boolean;
}) {
  const salary = data.salary;
  const locked = salary.priceState === "locked";
  const activeParticipants = data.participants.items.filter(({ status }) => status === "active");
  const unassigned = salary.participants.items.filter(
    ({ membership, status }) => status === "active" && !membership,
  ).length;

  return (
    <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">
            {salary.enabled ? "Participantes e teto salarial" : "Inscrições e elencos"}
          </h2>
          <Badge variant={locked ? "default" : "outline"}>
            {locked ? <LockKeyhole className="mr-1 size-3" /> : null}
            {salary.priceState === "disabled"
              ? "Sem teto"
              : locked
                ? "Valores congelados"
                : "Valores editáveis"}
          </Badge>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {salary.enabled
            ? "Inscrições, avaliação, composição de elencos e conformidade financeira em uma única operação revisionada."
            : "Gerencie participantes, GMs e composição dos elencos sem atribuir valores financeiros."}
        </p>
      </div>
      <div className="grid grid-cols-3 divide-x border bg-card/45 text-center">
        <Metric label="Inscritos" value={activeParticipants.length} />
        {salary.enabled ? (
          <>
            <Metric label="Teto" value={formatSalaryUnits(salary.capUnits, salary.displayLabel)} />
            <Metric
              label="Pendências"
              value={salary.validation.missingPriceCount}
              danger={numberValue(salary.validation.missingPriceCount) > 0}
            />
          </>
        ) : (
          <>
            <Metric label="Equipes" value={salary.teams.items.length} />
            <Metric label="Sem equipe" value={unassigned} />
          </>
        )}
      </div>
      {!isAdmin ? (
        <span className="text-xs text-muted-foreground">Visualização operacional</span>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number | string;
  danger?: boolean;
}) {
  return (
    <div className="min-w-24 px-4 py-2">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-semibold tabular-nums ${danger ? "text-amber-300" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function RegistrationBand({
  data,
  isAdmin,
}: {
  data: ChampionshipWorkspaceData;
  isAdmin: boolean;
}) {
  const transition = useServerFn(transitionChampionshipRegistrationFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const state = data.championship.registrationState;

  async function changeRegistration() {
    setBusy(true);
    setMessage(null);

    try {
      const result = await transition({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          operation: state === "open" ? "close" : "open",
          reason:
            state === "open"
              ? "Encerramento das inscrições pela área salarial"
              : "Abertura das inscrições pela área salarial",
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center">
        <div
          className={`grid size-10 shrink-0 place-items-center border ${
            state === "open"
              ? "border-primary/50 bg-primary/10 text-primary"
              : "text-muted-foreground"
          }`}
        >
          <UserRoundPlus className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">Inscrições</h3>
            <Badge variant="outline">
              {state === "open" ? "Abertas" : state === "closed" ? "Encerradas" : "Não abertas"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {state === "open"
              ? "Jogadores autenticados podem se inscrever pela página pública."
              : "A organização ainda pode incluir uma conta manualmente."}
          </p>
          {message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null}
        </div>
        {isAdmin ? (
          <div className="flex gap-2">
            <AccountRegistrationDialog data={data} />
            <Button variant="outline" disabled={busy} onClick={() => void changeRegistration()}>
              {state === "open" ? <LockKeyhole /> : <UserRoundPlus />}
              {state === "open" ? "Encerrar" : "Abrir inscrições"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AccountRegistrationDialog({ data }: { data: ChampionshipWorkspaceData }) {
  const createParticipant = useServerFn(createChampionshipParticipantFn);
  const searchAccounts = useServerFn(searchChampionshipAccountsFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState(data.accounts.items);
  const [query, setQuery] = useState("");
  const [selectedAccountUuid, setSelectedAccountUuid] = useState("");
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const registered = new Set(
    data.participants.items.flatMap(({ identity }) =>
      identity.kind === "account" ? [identity.accountUuid] : [],
    ),
  );
  const availableAccounts = accounts.filter(({ uuid }) => !registered.has(uuid));

  useEffect(() => {
    if (!open) return;

    let active = true;
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchAccounts({
          data: { search: query.trim() || undefined, limit: 20 },
        });
        if (active) setAccounts(result.items);
      } catch (error) {
        if (active) setMessage(messageFor(error));
      } finally {
        if (active) setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [open, query, searchAccounts]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const accountUuid = selectedAccountUuid;

    if (!accountUuid) {
      setMessage("Selecione uma conta.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const rawPrice = String(form.get("priceUnits") ?? "").trim();
      const result = await createParticipant({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          accountUuid,
          status: "active",
          priceUnits: rawPrice ? Number(rawPrice) : undefined,
          reason: String(form.get("reason") ?? "").trim() || undefined,
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setOpen(false);
      setQuery("");
      setSelectedAccountUuid("");
      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Incluir conta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inscrição pela organização</DialogTitle>
          <DialogDescription>
            Use para correções, substituições e inscrições autorizadas fora da janela pública.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          {message ? <InlineError message={message} /> : null}
          <div className="space-y-2">
            <Label htmlFor="accountSearch">Conta</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="accountSearch"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setMessage(null);
                }}
                className="pl-9"
                placeholder="Digite o nome da conta"
                autoComplete="off"
              />
            </div>
            <div
              className="bfl-scrollbar max-h-56 overflow-y-auto border"
              role="radiogroup"
              aria-label="Contas encontradas"
              aria-busy={searching}
            >
              {searching ? (
                <p className="px-3 py-5 text-center text-sm text-muted-foreground">Buscando…</p>
              ) : availableAccounts.length > 0 ? (
                availableAccounts.map((account) => {
                  const selected = selectedAccountUuid === account.uuid;
                  return (
                    <label
                      key={account.uuid}
                      className={`flex w-full cursor-pointer items-center justify-between border-b px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-muted/60 has-focus-visible:ring-2 has-focus-visible:ring-ring ${
                        selected ? "bg-primary/10 text-foreground" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="accountUuid"
                        value={account.uuid}
                        aria-label={`Selecionar ${account.name}`}
                        checked={selected}
                        onChange={() => {
                          setSelectedAccountUuid(account.uuid);
                          setMessage(null);
                        }}
                        className="sr-only"
                      />
                      <span className="font-medium">{account.name}</span>
                      {selected ? <Check className="size-4 text-primary" /> : null}
                    </label>
                  );
                })
              ) : (
                <p className="px-3 py-5 text-center text-sm text-muted-foreground">
                  Nenhuma conta disponível encontrada.
                </p>
              )}
            </div>
          </div>
          {data.championship.priceState === "locked" ? (
            <div className="space-y-2">
              <Label htmlFor="latePrice">Valor congelado</Label>
              <Input id="latePrice" name="priceUnits" type="number" min={0} required />
              <p className="text-xs text-muted-foreground">
                Este é o único momento em que o valor desta inscrição tardia poderá ser definido.
              </p>
            </div>
          ) : null}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="registrationReason">Justificativa</Label>
              <span className="text-xs text-muted-foreground">Opcional</span>
            </div>
            <Textarea
              id="registrationReason"
              name="reason"
              placeholder="Adicione um motivo à auditoria, se necessário"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || !selectedAccountUuid}>
              {busy ? "Incluindo…" : "Confirmar inscrição"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ValuationGrid({
  data,
  isAdmin,
  onMoveRequest,
}: {
  data: ChampionshipWorkspaceData;
  isAdmin: boolean;
  onMoveRequest: (request: RosterMoveRequest) => void;
}) {
  const savePrices = useServerFn(upsertChampionshipPricesFn);
  const loadPage = useServerFn(getChampionshipSalaryWorkspacePageFn);
  const router = useRouter();
  const [participants, setParticipants] = useState(data.salary.participants.items);
  const [nextCursor, setNextCursor] = useState(data.salary.participants.page.nextCursor);
  const [dirty, setDirty] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const editable = isAdmin && data.salary.enabled && data.salary.priceState === "editable";

  useEffect(() => {
    setParticipants(data.salary.participants.items);
    setNextCursor(data.salary.participants.page.nextCursor);
    setDirty({});
  }, [data.salary.participants]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");

    return participants.filter((participant) => {
      const value = dirty[participant.uuid] ?? participant.priceUnits;

      return (
        (!normalized || participant.displayName.toLocaleLowerCase("pt-BR").includes(normalized)) &&
        (!missingOnly || value === null)
      );
    });
  }, [dirty, missingOnly, participants, query]);

  function updatePrice(participant: SalaryParticipant, rawValue: string) {
    if (!editable) return;
    const price = Number(rawValue);

    if (!Number.isInteger(price) || price < 0) return;
    setDirty((current) => ({ ...current, [participant.uuid]: price }));
  }

  function pastePrices(index: number, event: ClipboardEvent<HTMLInputElement>) {
    if (!editable) return;
    const values = parsePastedSalaryValues(event.clipboardData.getData("text"));

    if (values.length <= 1) return;
    event.preventDefault();
    setDirty((current) => {
      const next = { ...current };

      values.forEach((value, offset) => {
        const participant = visible[index + offset];
        if (participant) next[participant.uuid] = value;
      });

      return next;
    });
  }

  function movePriceFocus(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    document.querySelector<HTMLInputElement>(`[data-price-index="${index + 1}"]`)?.focus();
  }

  async function save() {
    const prices = Object.entries(dirty).map(([participantId, priceUnits]) => ({
      participantId,
      priceUnits,
    }));

    if (prices.length === 0) return;
    setBusy(true);
    setMessage(null);

    try {
      const result = await savePrices({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          prices,
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);

    try {
      const page = await loadPage({
        data: {
          championshipUuid: data.championship.uuid,
          participantCursor: nextCursor,
          participantLimit: 100,
          teamLimit: 1,
        },
      });
      setParticipants((current) => [...current, ...page.participants.items]);
      setNextCursor(page.participants.page.nextCursor);
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-3 border-b px-4 py-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid size-9 place-items-center rounded-md border text-primary">
            <BadgeDollarSign className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold">Tabela de avaliação</h3>
            <p className="text-xs text-muted-foreground">
              Cole uma coluna de valores ou navegue pelas células com Enter.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-52 pl-8"
              placeholder="Filtrar participante"
            />
          </div>
          <label
            htmlFor="missing-prices-only"
            className="flex h-9 items-center gap-2 border px-3 text-sm"
          >
            <Checkbox
              id="missing-prices-only"
              checked={missingOnly}
              onCheckedChange={(checked) => setMissingOnly(checked === true)}
            />
            Sem valor
          </label>
          {isAdmin ? <FreezePricesDialog data={data} /> : null}
          <Button disabled={!editable || Object.keys(dirty).length === 0 || busy} onClick={save}>
            <Save />
            Salvar {Object.keys(dirty).length || ""}
          </Button>
        </div>
      </div>

      {message ? <div className="border-b px-4 py-3 text-sm text-red-300">{message}</div> : null}
      {numberValue(data.salary.validation.missingPriceCount) > 0 ? (
        <div className="flex items-center gap-2 border-b bg-amber-400/5 px-4 py-2 text-xs text-amber-200">
          <CircleAlert className="size-4" />
          {data.salary.validation.missingPriceCount} participante(s) ativo(s) ainda sem valor.
        </div>
      ) : null}

      <div className="divide-y sm:hidden">
        {visible.map((participant, index) => {
          const currentValue = dirty[participant.uuid] ?? participant.priceUnits;

          return (
            <article key={participant.uuid} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs tabular-nums text-muted-foreground">#{index + 1}</div>
                  <div className="truncate font-medium">{participant.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {participant.membership?.role === "gm"
                      ? "General Manager"
                      : participant.membership
                        ? "Jogador"
                        : "Disponível"}
                  </div>
                </div>
                <ParticipantStatusControl data={data} participant={participant} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">Elenco atual</div>
                  <div className="mt-1 text-sm">
                    {participant.membership?.teamName ?? "Sem equipe"}
                  </div>
                </div>
                <label>
                  <span className="text-[11px] uppercase text-muted-foreground">
                    Valor ({data.salary.displayLabel})
                  </span>
                  <Input
                    data-price-index={index}
                    type="number"
                    min={0}
                    value={currentValue ?? ""}
                    disabled={!editable}
                    aria-label={`Valor de ${participant.displayName}`}
                    className={`mt-1 text-right tabular-nums ${
                      currentValue === null ? "border-amber-400/60" : ""
                    }`}
                    onChange={(event) => updatePrice(participant, event.target.value)}
                    onPaste={(event) => pastePrices(index, event)}
                    onKeyDown={(event) => movePriceFocus(index, event)}
                  />
                </label>
              </div>
              <div>
                <div className="mb-1 text-[11px] uppercase text-muted-foreground">
                  Nova alocação
                </div>
                <RosterTargetControl
                  participant={participant}
                  teams={data.salary.teams.items}
                  disabled={!isAdmin}
                  onRequest={onMoveRequest}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden max-h-[560px] overflow-auto sm:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Participante</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Elenco</TableHead>
              <TableHead className="w-40 text-right">Valor ({data.salary.displayLabel})</TableHead>
              <TableHead className="w-64">Alocação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((participant, index) => {
              const currentValue = dirty[participant.uuid] ?? participant.priceUnits;

              return (
                <TableRow
                  key={participant.uuid}
                  draggable={isAdmin}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/championship-participant", participant.uuid);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                >
                  <TableCell className="text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{participant.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {participant.membership?.role === "gm"
                        ? "General Manager"
                        : participant.membership
                          ? "Jogador"
                          : "Disponível"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ParticipantStatusControl data={data} participant={participant} />
                  </TableCell>
                  <TableCell>
                    {participant.membership ? (
                      <span className="text-sm">{participant.membership.teamName}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem equipe</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      data-price-index={index}
                      type="number"
                      min={0}
                      value={currentValue ?? ""}
                      disabled={!editable}
                      aria-label={`Valor de ${participant.displayName}`}
                      className={`ml-auto w-28 text-right tabular-nums ${
                        currentValue === null ? "border-amber-400/60" : ""
                      }`}
                      onChange={(event) => updatePrice(participant, event.target.value)}
                      onPaste={(event) => pastePrices(index, event)}
                      onKeyDown={(event) => movePriceFocus(index, event)}
                    />
                  </TableCell>
                  <TableCell>
                    <RosterTargetControl
                      participant={participant}
                      teams={data.salary.teams.items}
                      disabled={!isAdmin}
                      onRequest={onMoveRequest}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {nextCursor ? (
        <div className="flex justify-center border-t p-3">
          <Button variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? "Carregando…" : "Carregar mais participantes"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function ParticipantStatusControl({
  data,
  participant,
}: {
  data: ChampionshipWorkspaceData;
  participant: SalaryParticipant;
}) {
  const updateStatus = useServerFn(updateChampionshipParticipantFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);

    try {
      const result = await updateStatus({
        data: {
          championshipUuid: data.championship.uuid,
          participantUuid: participant.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          status: String(form.get("status")) as
            | "pending"
            | "active"
            | "withdrawn"
            | "ineligible"
            | "removed",
          reason: String(form.get("reason") ?? "").trim(),
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setOpen(false);
      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {statusLabel(participant.status)}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar situação de {participant.displayName}</DialogTitle>
          <DialogDescription>
            Participantes em um elenco devem ser removidos antes de ficarem inativos.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          {message ? <InlineError message={message} /> : null}
          <div className="space-y-2">
            <Label htmlFor={`status-${participant.uuid}`}>Situação</Label>
            <NativeSelect
              id={`status-${participant.uuid}`}
              name="status"
              defaultValue={participant.status}
            >
              <NativeSelectOption value="pending">Pendente</NativeSelectOption>
              <NativeSelectOption value="active">Ativo</NativeSelectOption>
              <NativeSelectOption value="withdrawn">Desistente</NativeSelectOption>
              <NativeSelectOption value="ineligible">Inapto</NativeSelectOption>
              <NativeSelectOption value="removed">Removido</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`status-reason-${participant.uuid}`}>Justificativa</Label>
            <Textarea id={`status-reason-${participant.uuid}`} name="reason" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FreezePricesDialog({ data }: { data: ChampionshipWorkspaceData }) {
  const freeze = useServerFn(freezeChampionshipPricesFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const validation = data.salary.validation;
  const frozen = data.salary.priceState === "locked";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);

    try {
      const result = await freeze({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          reason: String(form.get("reason") ?? "").trim() || undefined,
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setOpen(false);
      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={frozen || !data.salary.enabled}>
          <LockKeyhole />
          {frozen ? "Congelados" : "Congelar"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Congelar valores da edição</DialogTitle>
          <DialogDescription>
            Depois desta ação, valores existentes não poderão ser alterados e toda movimentação
            passará pelo teto salarial.
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y border text-sm">
          <ReadinessRow
            ok={data.championship.registrationState === "closed"}
            label="Inscrições encerradas"
          />
          <ReadinessRow
            ok={numberValue(validation.missingPriceCount) === 0}
            label={
              numberValue(validation.missingPriceCount) === 0
                ? "Todos os participantes possuem valor"
                : `${validation.missingPriceCount} participante(s) sem valor`
            }
          />
          <ReadinessRow ok={data.salary.teams.items.length > 0} label="Equipes configuradas" />
        </div>
        <form className="space-y-4" onSubmit={submit}>
          {message ? <InlineError message={message} /> : null}
          <div className="space-y-2">
            <Label htmlFor="freezeReason">Nota de publicação</Label>
            <Textarea id="freezeReason" name="reason" placeholder="Opcional, fica na auditoria" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!validation.canFreeze || busy}>
              <LockKeyhole />
              Congelar e publicar valores
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReadinessRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      {ok ? (
        <Check className="size-4 text-emerald-300" />
      ) : (
        <CircleAlert className="size-4 text-amber-300" />
      )}
      <span>{label}</span>
    </div>
  );
}

function RosterTargetControl({
  participant,
  teams,
  disabled,
  onRequest,
}: {
  participant: SalaryParticipant;
  teams: SalaryTeam[];
  disabled: boolean;
  onRequest: (request: RosterMoveRequest) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] gap-2 sm:flex">
      <NativeSelect
        className="w-full min-w-0 sm:min-w-32"
        value={participant.membership?.teamUuid ?? ""}
        disabled={disabled || participant.status !== "active"}
        aria-label={`Equipe de ${participant.displayName}`}
        onChange={(event) =>
          onRequest({
            participant,
            targetTeamId: event.target.value || null,
            role: participant.membership?.role ?? "player",
          })
        }
      >
        <NativeSelectOption value="">Sem equipe</NativeSelectOption>
        {teams.map((team) => (
          <NativeSelectOption key={team.uuid} value={team.uuid}>
            {team.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {participant.membership ? (
        <NativeSelect
          className="w-full min-w-0 sm:min-w-28"
          value={participant.membership.role}
          disabled={disabled}
          aria-label={`Função de ${participant.displayName}`}
          onChange={(event) =>
            onRequest({
              participant,
              targetTeamId: participant.membership!.teamUuid,
              role: event.target.value as "gm" | "player",
            })
          }
        >
          <NativeSelectOption value="player">Jogador</NativeSelectOption>
          <NativeSelectOption value="gm">GM</NativeSelectOption>
        </NativeSelect>
      ) : null}
    </div>
  );
}

function TeamCapComparison({
  data,
  onMoveRequest,
}: {
  data: ChampionshipWorkspaceData;
  onMoveRequest: (request: RosterMoveRequest) => void;
}) {
  const reorderRoster = useServerFn(reorderChampionshipRosterFn);
  const router = useRouter();
  const boardRef = useRef<HTMLElement>(null);
  const kanbanScrollerRef = useRef<HTMLDivElement>(null);
  const boardPanRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(
    null,
  );
  const participants = data.salary.participants.items;
  const salaryEnabled = data.salary.enabled;
  const unassigned = participants.filter(
    ({ membership, status }) => !membership && status === "active",
  );

  async function reorder(team: SalaryTeam, ordered: SalaryParticipant[]) {
    try {
      const result = await reorderRoster({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          teamId: team.uuid,
          participantIds: ordered.map(({ uuid }) => uuid),
        },
      });
      if (!result.ok) return toast.error(result.message);
      await router.invalidate();
    } catch (error) {
      toast.error(messageFor(error));
    }
  }

  useEffect(() => {
    const board = boardRef.current;
    const scroller = kanbanScrollerRef.current;
    if (!board || !scroller) return;

    const cleanups = [
      autoScrollForElements({
        element: scroller,
        getAllowedAxis: () => "horizontal",
        getConfiguration: () => ({ maxScrollSpeed: "fast" }),
      }),
      monitorForElements({
        onDrop({ source, location }) {
          const participantUuid = source.data.participantUuid;
          if (typeof participantUuid !== "string") return;
          const participant = participants.find((candidate) => candidate.uuid === participantUuid);
          const target = location.current.dropTargets[0];
          const targetTeamUuid = target?.data.teamUuid;
          const targetParticipantUuid = target?.data.participantUuid;

          if (!participant || typeof targetTeamUuid !== "string") return;

          if (participant.membership?.teamUuid !== targetTeamUuid) {
            onMoveRequest({
              participant,
              targetTeamId: targetTeamUuid === "available" ? null : targetTeamUuid,
              role: participant.membership?.role ?? "player",
            });
            return;
          }

          if (
            typeof targetParticipantUuid !== "string" ||
            targetParticipantUuid === participantUuid
          ) {
            return;
          }

          const team = data.salary.teams.items.find(
            (candidate) => candidate.uuid === targetTeamUuid,
          );
          if (!team) return;
          const ordered = participants
            .filter(({ membership }) => membership?.teamUuid === team.uuid)
            .sort(
              (left, right) =>
                Number(right.membership?.role === "gm") - Number(left.membership?.role === "gm") ||
                numberValue(left.membership?.displayOrder) -
                  numberValue(right.membership?.displayOrder),
            );
          const from = ordered.findIndex((candidate) => candidate.uuid === participantUuid);
          const to = ordered.findIndex((candidate) => candidate.uuid === targetParticipantUuid);
          if (from < 0 || to < 0) return;
          const next = [...ordered];
          const [moving] = next.splice(from, 1);
          next.splice(from < to ? to - 1 : to, 0, moving!);
          void reorder(team, next);
        },
      }),
    ];

    for (const element of board.querySelectorAll<HTMLElement>("[data-roster-participant]")) {
      const participantUuid = element.dataset.rosterParticipant;
      const teamUuid = element.dataset.rosterTeam;
      if (!participantUuid || !teamUuid) continue;
      cleanups.push(
        combine(
          draggable({
            element,
            getInitialData: () => ({ type: "championship-participant", participantUuid }),
            onDragStart: () => element.setAttribute("data-dragging", "true"),
            onDrop: () => element.removeAttribute("data-dragging"),
          }),
          dropTargetForElements({
            element,
            getData: () => ({ type: "roster-participant", participantUuid, teamUuid }),
            getIsSticky: () => true,
          }),
        ),
      );
    }
    for (const element of board.querySelectorAll<HTMLElement>("[data-roster-team]")) {
      const teamUuid = element.dataset.rosterTeam;
      if (!teamUuid) continue;
      cleanups.push(
        dropTargetForElements({
          element,
          getData: () => ({ type: "roster-team", teamUuid }),
          getIsSticky: () => true,
        }),
      );
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [data.salary.teams.items, onMoveRequest, participants]);

  return (
    <section ref={boardRef} className="min-w-0 max-w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {salaryEnabled ? "Comparação de equipes" : "Elencos por equipe"}
          </h3>
          <p className="text-xs text-muted-foreground">
            Arraste participantes para qualquer equipe ou use os seletores de alocação.
          </p>
        </div>
        <Badge variant="outline">{data.salary.teams.items.length} equipes</Badge>
      </div>
      <div
        ref={kanbanScrollerRef}
        className="bfl-scrollbar min-w-0 max-w-full cursor-grab overflow-x-auto pb-3 active:cursor-grabbing"
        onPointerDown={(event) => {
          if (
            event.button !== 0 ||
            (event.target as HTMLElement).closest(
              "[data-roster-participant], button, input, select, textarea, a",
            )
          ) {
            return;
          }
          boardPanRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startScrollLeft: event.currentTarget.scrollLeft,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const pan = boardPanRef.current;
          if (!pan || pan.pointerId !== event.pointerId) return;
          event.currentTarget.scrollLeft = pan.startScrollLeft - (event.clientX - pan.startX);
        }}
        onPointerUp={(event) => {
          if (boardPanRef.current?.pointerId !== event.pointerId) return;
          boardPanRef.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          boardPanRef.current = null;
        }}
        onWheelCapture={(event) => {
          const horizontalDelta = event.shiftKey ? event.deltaY : event.deltaX;
          if (horizontalDelta === 0) return;
          event.currentTarget.scrollLeft += horizontalDelta;
          event.preventDefault();
        }}
      >
        <div className="flex min-w-max gap-3">
          {data.salary.teams.items.map((team) => {
            const teamParticipants = participants
              .filter(({ membership }) => membership?.teamUuid === team.uuid)
              .sort(
                (left, right) =>
                  Number(right.membership?.role === "gm") -
                    Number(left.membership?.role === "gm") ||
                  numberValue(left.membership?.displayOrder) -
                    numberValue(right.membership?.displayOrder),
              );

            return (
              <div
                key={team.uuid}
                data-roster-team={team.uuid}
                className={`flex h-[calc(100dvh-18rem)] min-h-[30rem] w-[22rem] shrink-0 flex-col border bg-card/45 ${
                  salaryEnabled && team.overCap ? "border-red-400/60" : ""
                }`}
              >
                <div className="border-b p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{team.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {team.rosterSize} pessoas no elenco
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!salaryEnabled ? null : team.approvedOverCap ? (
                        <Badge variant="destructive" className="bg-red-800 text-white">
                          Exceção
                        </Badge>
                      ) : team.overCap ? (
                        <ShieldAlert className="size-5 text-red-300" />
                      ) : (
                        <Check className="size-5 text-emerald-300" />
                      )}
                      <TeamConfigurationMenu
                        team={team}
                        participants={teamParticipants}
                        onMoveRequest={onMoveRequest}
                      />
                    </div>
                  </div>
                  {salaryEnabled ? (
                    <>
                      <Progress
                        aria-label={`Uso do teto salarial de ${team.name}`}
                        value={Math.min(
                          100,
                          salaryCapPercentage(team.usageUnits, data.salary.capUnits),
                        )}
                        className={`mt-3 ${team.overCap ? "[&_[data-slot=progress-indicator]]:bg-red-400" : ""}`}
                      />
                      <div className="mt-2 flex justify-between text-xs tabular-nums">
                        <span>
                          {formatSalaryUnits(team.usageUnits, data.salary.displayLabel)} /{" "}
                          {formatSalaryUnits(data.salary.capUnits, data.salary.displayLabel)}
                        </span>
                        <span
                          className={
                            numberValue(team.remainingUnits) < 0
                              ? "text-red-300"
                              : "text-muted-foreground"
                          }
                        >
                          {numberValue(team.remainingUnits) >= 0
                            ? `${team.remainingUnits} livres`
                            : `${-numberValue(team.remainingUnits)} acima`}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="min-h-0 flex-1 divide-y overflow-y-auto overscroll-contain">
                  {teamParticipants.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">Solte um participante aqui.</p>
                  ) : (
                    teamParticipants.map((participant, position) => (
                      <RosterPerson
                        key={participant.uuid}
                        participant={participant}
                        salaryEnabled={salaryEnabled}
                        position={position}
                        canMoveUp={position > 0}
                        canMoveDown={position < teamParticipants.length - 1}
                        onMove={(direction) => {
                          const next = [...teamParticipants];
                          const target = position + direction;
                          [next[position], next[target]] = [next[target]!, next[position]!];
                          void reorder(team, next);
                        }}
                      />
                    ))
                  )}
                </div>
                {salaryEnabled && team.activeException ? (
                  <div className="border-t bg-red-400/5 px-4 py-3 text-xs">
                    <div className="font-medium text-red-200">Exceção aprovada</div>
                    <div className="mt-1 text-muted-foreground">
                      Expira na próxima alteração do elenco.
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <AvailableRoster participants={unassigned} salaryEnabled={salaryEnabled} />
    </section>
  );
}

export function TeamConfigurationMenu({
  team,
  participants,
  onMoveRequest,
}: {
  team: SalaryTeam;
  participants: SalaryParticipant[];
  onMoveRequest: (request: RosterMoveRequest) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [managersOpen, setManagersOpen] = useState(false);
  const openManagersAfterMenuClose = useRef(false);

  useEffect(() => {
    if (menuOpen || !openManagersAfterMenuClose.current) return;

    openManagersAfterMenuClose.current = false;
    setManagersOpen(true);
  }, [menuOpen]);

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" title={`Configurar ${team.name}`}>
            <Settings2 />
            <span className="sr-only">Configurar equipe</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              openManagersAfterMenuClose.current = true;
              setMenuOpen(false);
            }}
          >
            <Crown />
            Gerenciar General Managers
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={managersOpen} onOpenChange={setManagersOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>General Managers de {team.name}</DialogTitle>
            <DialogDescription>
              Defina quem representa a equipe no draft, sem alterar o elenco ou a ordem dos
              participantes.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 divide-y overflow-y-auto border">
            {participants.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Esta equipe ainda não tem pessoas.
              </p>
            ) : (
              participants.map((participant) => {
                const isManager = participant.membership?.role === "gm";

                return (
                  <div key={participant.uuid} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{participant.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {isManager ? "General Manager atual" : "Jogador"}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={isManager ? "outline" : "default"}
                      size="sm"
                      onClick={() => {
                        setManagersOpen(false);
                        onMoveRequest({
                          participant,
                          targetTeamId: team.uuid,
                          role: isManager ? "player" : "gm",
                        });
                      }}
                    >
                      <Crown />
                      {isManager ? "Remover General Manager" : "Definir General Manager"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AvailableRoster({
  participants,
  salaryEnabled,
}: {
  participants: SalaryParticipant[];
  salaryEnabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visibleParticipants = normalizedQuery
    ? participants.filter((participant) =>
        participant.displayName.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
      )
    : participants;

  return (
    <div data-roster-team="available" className="mt-5 flex min-w-0 flex-col border bg-card/30">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold">Disponíveis</div>
          <div className="text-xs text-muted-foreground">
            {participants.length} participante(s) sem equipe
          </div>
        </div>
        {participants.length > 8 ? (
          <div className="w-full sm:max-w-xs">
            <Label className="sr-only" htmlFor="available-roster-filter">
              Buscar participantes disponíveis
            </Label>
            <Input
              id="available-roster-filter"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar participante"
            />
          </div>
        ) : null}
      </div>
      <div className="min-h-32 max-h-[30rem] divide-y overflow-y-auto overscroll-contain xl:grid xl:grid-cols-2 xl:divide-x xl:divide-y-0 xl:[&>*]:border-b">
        {visibleParticipants.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {normalizedQuery
              ? "Nenhum participante corresponde à busca."
              : "Nenhum participante nesta coluna."}
          </p>
        ) : (
          visibleParticipants.map((participant) => (
            <RosterPerson
              key={participant.uuid}
              participant={participant}
              salaryEnabled={salaryEnabled}
            />
          ))
        )}
      </div>
    </div>
  );
}

function RosterPerson({
  participant,
  salaryEnabled,
  position,
  canMoveUp,
  canMoveDown,
  onMove,
}: {
  participant: SalaryParticipant;
  salaryEnabled: boolean;
  position?: number;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMove?: (direction: -1 | 1) => void;
}) {
  return (
    <div
      data-roster-participant={participant.uuid}
      data-roster-team={participant.membership?.teamUuid ?? "available"}
      className="flex cursor-grab items-center gap-3 px-4 py-3 active:cursor-grabbing data-[dragging]:opacity-40"
    >
      <div className="grid size-8 place-items-center border bg-background text-xs font-semibold">
        {participant.displayName.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {position !== undefined ? (
            <span className="text-xs tabular-nums text-muted-foreground">{position + 1}</span>
          ) : null}
          <div className="truncate text-sm font-medium">{participant.displayName}</div>
        </div>
        <div className="text-xs text-muted-foreground">
          {participant.membership?.role === "gm" ? "General Manager" : "Jogador"}
        </div>
      </div>
      {salaryEnabled ? (
        <span className="text-xs tabular-nums">{participant.priceUnits ?? "—"}</span>
      ) : null}
      {onMove ? (
        <div className="flex shrink-0 border-l pl-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={!canMoveUp}
            title="Subir posição"
            onClick={() => onMove(-1)}
          >
            <ChevronUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={!canMoveDown}
            title="Descer posição"
            onClick={() => onMove(1)}
          >
            <ChevronDown />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function RosterMoveDialog({
  data,
  request,
  onOpenChange,
}: {
  data: ChampionshipWorkspaceData;
  request: RosterMoveRequest | null;
  onOpenChange: (open: boolean) => void;
}) {
  const previewMove = useServerFn(previewChampionshipRosterMoveFn);
  const executeMove = useServerFn(executeChampionshipRosterMoveFn);
  const router = useRouter();
  const [preview, setPreview] = useState<ChampionshipRosterMovePreview>();
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!request) {
      setPreview(undefined);
      setMessage(null);
      return;
    }

    setLoading(true);
    void previewMove({
      data: {
        championshipUuid: data.championship.uuid,
        participantId: request.participant.uuid,
        targetTeamId: request.targetTeamId,
        role: request.role,
      },
    })
      .then((result) => {
        if (result.ok) setPreview(result.data);
        else setMessage(result.message);
      })
      .catch((error) => setMessage(messageFor(error)))
      .finally(() => setLoading(false));
  }, [data.championship.uuid, previewMove, request]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request || !preview) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);

    try {
      const result = await executeMove({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          participantId: request.participant.uuid,
          targetTeamId: request.targetTeamId,
          role: request.role,
          confirmCapException: preview.requiresCapException,
          reason: String(form.get("reason") ?? "").trim() || undefined,
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      onOpenChange(false);
      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[min(760px,calc(100vh-2rem))] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader>
          <div className="border-b px-5 py-5 sm:px-6">
            <DialogTitle>Revisar movimentação de elenco</DialogTitle>
            <DialogDescription className="mt-1">
              O impacto é recalculado no servidor antes da confirmação transacional.
            </DialogDescription>
          </div>
        </DialogHeader>
        {loading ? (
          <div className="grid min-h-64 place-items-center text-sm text-muted-foreground">
            Calculando impacto…
          </div>
        ) : preview ? (
          <form className="bfl-scrollbar min-h-0 overflow-y-auto" onSubmit={submit}>
            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="grid gap-3 border bg-card/35 p-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                <MoveEndpoint
                  label="Origem"
                  teamName={preview.source?.teamName ?? "Sem equipe"}
                  align="start"
                />
                <ChevronRight className="mx-auto size-5 text-primary" />
                <MoveEndpoint
                  label="Destino"
                  teamName={preview.target?.teamName ?? "Sem equipe"}
                  align="end"
                />
                <div className="border-t pt-3 sm:col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center border bg-background text-sm font-semibold text-primary">
                      {preview.participant.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">
                        {preview.participant.displayName}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">
                          {request?.role === "gm" ? "General Manager" : "Jogador"}
                        </Badge>
                        {data.salary.enabled ? (
                          <span className="tabular-nums">
                            {formatSalaryUnits(
                              preview.participant.priceUnits ?? 0,
                              data.salary.displayLabel,
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <section className="overflow-hidden border">
                <div className="border-b px-4 py-3">
                  <h3 className="text-sm font-semibold">Impacto nas equipes</h3>
                </div>
                <div className="divide-y">
                  {preview.affectedTeams.map((team) => (
                    <TeamMoveImpact
                      key={team.teamUuid}
                      team={team}
                      salaryEnabled={data.salary.enabled}
                      displayLabel={data.salary.displayLabel}
                    />
                  ))}
                </div>
              </section>

              {preview.requiresCapException ? (
                <Alert variant="destructive">
                  <ShieldAlert />
                  <AlertTitle>Exceção administrativa necessária</AlertTitle>
                  <AlertDescription>
                    A equipe continuará marcada como não conforme. A aprovação expira na próxima
                    alteração do elenco.
                  </AlertDescription>
                </Alert>
              ) : null}
              {preview.violations.filter(
                (violation) => violation !== "O teto salarial seria excedido.",
              ).length > 0 ? (
                <InlineError
                  message={preview.violations
                    .filter((violation) => violation !== "O teto salarial seria excedido.")
                    .join(" ")}
                />
              ) : null}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <Label htmlFor="moveReason">
                    {preview.requiresCapException
                      ? "Justificativa da exceção"
                      : "Nota da movimentação"}
                  </Label>
                  {!preview.requiresCapException ? (
                    <span className="text-xs text-muted-foreground">Opcional</span>
                  ) : null}
                </div>
                <Textarea
                  id="moveReason"
                  name="reason"
                  required={preview.requiresCapException}
                  placeholder="Fica registrada na auditoria"
                />
              </div>
              {message ? <InlineError message={message} /> : null}
            </div>
            <DialogFooter className="sticky bottom-0 border-t bg-background px-5 py-4 sm:px-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={busy}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  busy ||
                  preview.violations.some(
                    (violation) => violation !== "O teto salarial seria excedido.",
                  )
                }
                variant={preview.requiresCapException ? "destructive" : "default"}
              >
                {preview.requiresCapException ? <ShieldAlert /> : <Check />}
                {busy
                  ? "Confirmando…"
                  : preview.requiresCapException
                    ? "Aprovar exceção e mover"
                    : "Confirmar movimentação"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="px-5 py-5 sm:px-6">
            <InlineError message={message ?? "Não foi possível calcular a movimentação."} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MoveEndpoint({
  label,
  teamName,
  align,
}: {
  label: string;
  teamName: string;
  align: "start" | "end";
}) {
  return (
    <div className={align === "end" ? "text-left sm:text-right" : "text-left"}>
      <div className="text-[11px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-semibold">{teamName}</div>
    </div>
  );
}

function TeamMoveImpact({
  team,
  salaryEnabled,
  displayLabel,
}: {
  team: ChampionshipRosterMovePreview["affectedTeams"][number];
  salaryEnabled: boolean;
  displayLabel: string;
}) {
  const usageChanged = numberValue(team.usageBeforeUnits) !== numberValue(team.usageAfterUnits);

  return (
    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="truncate font-medium">{team.teamName}</div>
      </div>
      {salaryEnabled ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="text-sm tabular-nums">
            {formatSalaryUnits(team.usageBeforeUnits, displayLabel)}
            {usageChanged ? ` → ${formatSalaryUnits(team.usageAfterUnits, displayLabel)}` : ""}
          </span>
          <Badge variant={team.overCapAfter ? "destructive" : "outline"}>
            {team.overCapAfter
              ? "Acima do teto"
              : `${formatSalaryUnits(team.remainingAfterUnits, displayLabel)} livres`}
          </Badge>
        </div>
      ) : null}
    </div>
  );
}

function TradeSimulation({ data }: { data: ChampionshipWorkspaceData }) {
  const rostered = data.salary.participants.items.filter(({ membership }) => membership);
  const [firstUuid, setFirstUuid] = useState("");
  const [secondUuid, setSecondUuid] = useState("");
  const first = rostered.find(({ uuid }) => uuid === firstUuid);
  const second = rostered.find(({ uuid }) => uuid === secondUuid);
  const validPair =
    first?.membership &&
    second?.membership &&
    first.membership.teamUuid !== second.membership.teamUuid;
  const projections = validPair
    ? [
        simulateTeamAfterSwap(
          data.salary.teams.items,
          first.membership!.teamUuid,
          numberValue(first.priceUnits),
          numberValue(second.priceUnits),
          numberValue(data.salary.capUnits),
        ),
        simulateTeamAfterSwap(
          data.salary.teams.items,
          second.membership!.teamUuid,
          numberValue(second.priceUnits),
          numberValue(first.priceUnits),
          numberValue(data.salary.capUnits),
        ),
      ]
    : [];

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <ArrowRightLeft className="size-5 text-cyan-300" />
        <div>
          <h3 className="font-semibold">Simulador de troca</h3>
          <p className="text-xs text-muted-foreground">
            Compare o impacto financeiro antes de abrir uma negociação.
          </p>
        </div>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end">
        <ParticipantSelect
          label="Sai da primeira equipe"
          value={firstUuid}
          participants={rostered.filter(({ uuid }) => uuid !== secondUuid)}
          onChange={setFirstUuid}
        />
        <ArrowRightLeft className="mx-auto mb-2 size-5 text-muted-foreground" />
        <ParticipantSelect
          label="Sai da segunda equipe"
          value={secondUuid}
          participants={rostered.filter(({ uuid }) => uuid !== firstUuid)}
          onChange={setSecondUuid}
        />
      </div>
      {firstUuid && secondUuid && !validPair ? (
        <p className="border-t px-4 py-3 text-sm text-amber-200">
          Escolha participantes de equipes diferentes.
        </p>
      ) : null}
      {projections.length > 0 ? (
        <div className="grid border-t md:grid-cols-2 md:divide-x">
          {projections.map((projection) => (
            <div key={projection.team.uuid} className="flex items-center gap-4 px-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{projection.team.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatSalaryUnits(projection.team.usageUnits, data.salary.displayLabel)} →{" "}
                  {formatSalaryUnits(projection.usageAfter, data.salary.displayLabel)}
                </div>
              </div>
              <Badge variant={projection.overCap ? "destructive" : "outline"}>
                {projection.overCap ? "Excede o teto" : `${projection.remaining} livres`}
              </Badge>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ParticipantSelect({
  label,
  value,
  participants,
  onChange,
}: {
  label: string;
  value: string;
  participants: SalaryParticipant[];
  onChange: (value: string) => void;
}) {
  const selectId = useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={selectId}>{label}</Label>
      <EntityPicker
        id={selectId}
        value={value}
        onValueChange={onChange}
        ariaLabel={label}
        placeholder="Selecionar participante"
        searchPlaceholder="Buscar participante…"
        emptyLabel="Nenhum participante encontrado."
        options={participants.map((participant) => ({
          value: participant.uuid,
          label: participant.displayName,
          detail: [
            participant.membership?.teamName,
            participant.priceUnits === null ? "Sem valor" : String(participant.priceUnits),
          ]
            .filter((part): part is string => !!part)
            .join(" · "),
        }))}
      />
    </div>
  );
}

function simulateTeamAfterSwap(
  teams: SalaryTeam[],
  teamUuid: string,
  outgoing: number,
  incoming: number,
  cap: number,
) {
  const team = teams.find(({ uuid }) => uuid === teamUuid)!;
  const simulation = simulateSalarySwap(team.usageUnits, outgoing, incoming, cap);

  return {
    team,
    ...simulation,
  };
}

function RosterHistory({ data }: { data: ChampionshipWorkspaceData }) {
  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <History className="size-5 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">Histórico de elencos</h3>
          <p className="text-xs text-muted-foreground">
            Entradas encerradas permanecem consultáveis por revisão.
          </p>
        </div>
      </div>
      {data.rosterHistory.items.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhuma movimentação registrada.
        </p>
      ) : (
        <>
          <div className="divide-y sm:hidden">
            {data.rosterHistory.items.map((membership) => (
              <article key={membership.uuid} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{membership.participant.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {membership.team.name} ·{" "}
                      {membership.role === "gm" ? "General Manager" : "Jogador"}
                    </div>
                  </div>
                  <Badge variant="outline">{membership.endedAt ? "Encerrada" : "Ativa"}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="uppercase text-muted-foreground">Origem</div>
                    <div className="mt-1">{acquisitionLabel(membership.acquisitionSource)}</div>
                  </div>
                  <div>
                    <div className="uppercase text-muted-foreground">Revisões</div>
                    <div className="mt-1 tabular-nums">
                      {membership.effectiveFromRevision}
                      {membership.effectiveToRevision
                        ? `–${membership.effectiveToRevision}`
                        : "–atual"}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden max-h-80 overflow-auto sm:block">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Revisões</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rosterHistory.items.map((membership) => (
                  <TableRow key={membership.uuid}>
                    <TableCell className="font-medium">
                      {membership.participant.displayName}
                    </TableCell>
                    <TableCell>{membership.team.name}</TableCell>
                    <TableCell>
                      {membership.role === "gm" ? "General Manager" : "Jogador"}
                    </TableCell>
                    <TableCell>{acquisitionLabel(membership.acquisitionSource)}</TableCell>
                    <TableCell className="tabular-nums">
                      {membership.effectiveFromRevision}
                      {membership.effectiveToRevision
                        ? `–${membership.effectiveToRevision}`
                        : "–atual"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{membership.endedAt ? "Encerrada" : "Ativa"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 border border-red-400/40 bg-red-400/5 px-3 py-2 text-sm text-red-200">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function statusLabel(status: SalaryParticipant["status"]) {
  return {
    pending: "Pendente",
    active: "Ativo",
    withdrawn: "Desistente",
    ineligible: "Inapto",
    removed: "Removido",
  }[status];
}

function acquisitionLabel(
  source: ChampionshipWorkspaceData["rosterHistory"]["items"][number]["acquisitionSource"],
) {
  return {
    staff: "Organização",
    draft: "Draft",
    trade: "Troca",
    replacement: "Substituição",
    "historical-import": "Importação",
  }[source];
}

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

function numberValue(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}
