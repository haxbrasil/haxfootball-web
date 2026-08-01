import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ApiAccountSession } from "#/server/auth/session";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Activity,
  Archive,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleDollarSign,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileClock,
  GitBranch,
  Goal,
  ListOrdered,
  MessageSquareText,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Radio,
  Save,
  Search,
  Send,
  Settings2,
  Shield,
  Trophy,
  Trash2,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "#/components/ui/command";
import { Kbd } from "#/components/ui/kbd";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Switch } from "#/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Textarea } from "#/components/ui/textarea";
import { hasApiPermission } from "#/server/auth/permissions";
import type { ChampionshipWorkspaceData } from "#/server/api/championship-api";
import {
  changeChampionshipRoomProgramFn,
  createChampionshipAssignmentFn,
  createChampionshipTeamFn,
  createChampionshipThreadFn,
  createTeamIdentityFn,
  heartbeatChampionshipPresenceFn,
  addChampionshipCommentFn,
  transitionChampionshipFn,
  updateChampionshipFn,
  updateChampionshipAssignmentFn,
  updateChampionshipInboxItemFn,
  updateChampionshipThreadFn,
  upsertChampionshipSavedViewFn,
} from "#/server/api/championship-functions";
import { deduplicateChampionshipPresence } from "./workspace-presence";
import {
  championshipContextLabel,
  championshipLifecycleLabel,
  championshipLifecycleTone,
  championshipTargetLabel,
} from "#/features/championships/championship-labels";
import { SalaryWorkspace } from "#/features/admin/championships/salary-workspace";
import { DraftWorkspace } from "#/features/admin/championships/draft-workspace";
import { FormatWorkspace } from "#/features/admin/championships/format-workspace";
import { MatchWorkspace } from "#/features/admin/championships/match-workspace";
import { StatisticsWorkspace } from "#/features/admin/championships/statistics-workspace";
import { ChampionshipArchiveWorkspace } from "#/features/admin/championships/archive-workspace";

export type ChampionshipWorkspaceView =
  | "setup"
  | "teams"
  | "salary"
  | "draft"
  | "format"
  | "matches"
  | "statistics"
  | "archive"
  | "activity";

export function ChampionshipWorkspacePage({
  data,
  session,
  view,
  inspector,
  selectedMatchUuid,
}: {
  data: ChampionshipWorkspaceData;
  session: ApiAccountSession;
  view: ChampionshipWorkspaceView;
  inspector: boolean;
  selectedMatchUuid: string | null;
}) {
  const navigate = useNavigate({ from: "/admin/championships/$championshipId" });
  const championship = data.championship;
  const isAdmin = hasApiPermission(session, "championship:admin");
  const [commandOpen, setCommandOpen] = useState(false);
  const saveView = useServerFn(upsertChampionshipSavedViewFn);
  const router = useRouter();

  useChampionshipPresence(championship.uuid, view, selectedMatchUuid);
  const liveStatus = useChampionshipLiveUpdates(championship.uuid);
  useWorkspaceShortcuts(setCommandOpen);
  useSavedWorkspaceView(data.savedViews.items, (state) => {
    void navigate({
      search: (current) => ({ ...current, ...state }),
      replace: true,
    });
  });

  function selectView(nextView: ChampionshipWorkspaceView) {
    void navigate({
      search: (current) => ({ ...current, view: nextView }),
      replace: true,
    });
  }

  function toggleInspector() {
    void navigate({
      search: (current) => ({ ...current, inspector: !inspector }),
      replace: true,
    });
  }

  function selectMatch(matchUuid: string) {
    void navigate({
      search: (current) => ({ ...current, view: "matches", match: matchUuid }),
      replace: true,
    });
  }

  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-background">
      <ChampionshipWorkspaceHeader
        data={data}
        inspector={inspector}
        isAdmin={isAdmin}
        liveStatus={liveStatus}
        onOpenCommands={() => setCommandOpen(true)}
        onToggleInspector={toggleInspector}
      />

      <div
        className={`grid min-h-[calc(100vh-13rem)] ${
          inspector
            ? "xl:grid-cols-[190px_minmax(0,1fr)_330px]"
            : "xl:grid-cols-[190px_minmax(0,1fr)]"
        }`}
      >
        <WorkspaceNavigation view={view} onSelect={selectView} data={data} />

        <main className="min-w-0 px-4 py-5 sm:px-6">
          {view === "setup" ? (
            <SetupWorkspace data={data} isAdmin={isAdmin} />
          ) : view === "teams" ? (
            <TeamsWorkspace data={data} isAdmin={isAdmin} />
          ) : view === "salary" ? (
            <SalaryWorkspace data={data} isAdmin={isAdmin} />
          ) : view === "draft" ? (
            <DraftWorkspace data={data} session={session} mode="admin" />
          ) : view === "format" ? (
            <FormatWorkspace data={data} mode="admin" />
          ) : view === "matches" ? (
            <MatchWorkspace
              data={data}
              selectedMatchUuid={selectedMatchUuid}
              onSelectMatch={selectMatch}
            />
          ) : view === "statistics" ? (
            <StatisticsWorkspace data={data} />
          ) : view === "archive" ? (
            <ChampionshipArchiveWorkspace data={data} mode="admin" />
          ) : (
            <ActivityWorkspace data={data} />
          )}
        </main>

        {inspector ? <WorkspaceInspector data={data} session={session} view={view} /> : null}
      </div>
      <WorkspaceCommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        championshipSlug={championship.slug}
        inspector={inspector}
        onSelectView={selectView}
        onToggleInspector={toggleInspector}
        savedViews={data.savedViews.items}
        onSaveDefault={() => {
          void saveView({
            data: {
              championshipUuid: championship.uuid,
              surface: "workspace",
              name: "Vista inicial",
              state: { view, inspector },
              isDefault: true,
            },
          }).then(() => router.invalidate());
        }}
      />
    </div>
  );
}

function ChampionshipWorkspaceHeader({
  data,
  inspector,
  isAdmin,
  liveStatus,
  onOpenCommands,
  onToggleInspector,
}: {
  data: ChampionshipWorkspaceData;
  inspector: boolean;
  isAdmin: boolean;
  liveStatus: "connecting" | "live" | "offline";
  onOpenCommands: () => void;
  onToggleInspector: () => void;
}) {
  const championship = data.championship;

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="flex min-h-20 items-center gap-4 px-4 sm:px-6">
        <Button asChild variant="ghost" size="icon" title="Voltar aos campeonatos">
          <Link to="/admin/championships">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold">{championship.name}</h1>
            {championship.editionLabel ? (
              <span className="text-sm text-muted-foreground">{championship.editionLabel}</span>
            ) : null}
            <Badge variant="outline" className={championshipLifecycleTone(championship.lifecycle)}>
              {championshipLifecycleLabel(championship.lifecycle)}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{championship.competitionType.name}</Badge>
            <MetadataBadge label="Revisão" value={championship.revision} />
            <MetadataBadge label="Evento" value={championship.changeSequence} />
            {!isAdmin ? (
              <Badge variant="outline" className="text-muted-foreground">
                Modo operação
              </Badge>
            ) : null}
            <Badge
              variant="outline"
              className={
                liveStatus === "live"
                  ? "border-primary/50 bg-primary/5 text-primary"
                  : liveStatus === "offline"
                    ? "border-red-600/50 bg-red-500/5 text-red-400"
                    : "text-muted-foreground"
              }
            >
              {liveStatus === "live"
                ? "Colaboração ao vivo"
                : liveStatus === "offline"
                  ? "Reconectando"
                  : "Conectando"}
            </Badge>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="outline" size="sm" onClick={onOpenCommands}>
            <Search />
            Comandos
            <Kbd>⌘K</Kbd>
          </Button>
          {championship.visibility === "public" ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/championships/$slug" params={{ slug: championship.slug }} target="_blank">
                <Eye />
                Página pública
              </Link>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            title={inspector ? "Fechar painel lateral" : "Abrir painel lateral"}
            onClick={onToggleInspector}
          >
            {inspector ? <PanelRightClose /> : <PanelRightOpen />}
          </Button>
        </div>
      </div>
    </header>
  );
}

function MetadataBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <Badge variant="outline" className="gap-1.5 pr-1 text-muted-foreground">
      {label}
      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none text-foreground tabular-nums">
        {value}
      </span>
    </Badge>
  );
}

function WorkspaceNavigation({
  view,
  onSelect,
  data,
}: {
  view: ChampionshipWorkspaceView;
  onSelect: (view: ChampionshipWorkspaceView) => void;
  data: ChampionshipWorkspaceData;
}) {
  const items: {
    value: ChampionshipWorkspaceView;
    label: string;
    icon: typeof Settings2;
    count?: number;
  }[] = [
    { value: "setup", label: "Configuração", icon: Settings2 },
    { value: "teams", label: "Equipes", icon: Users, count: data.teams.items.length },
    {
      value: "salary",
      label: "Inscrições e elencos",
      icon: CircleDollarSign,
      count: data.salary.enabled ? Number(data.salary.validation.missingPriceCount) : undefined,
    },
    {
      value: "draft",
      label: "Draft e trocas",
      icon: ListOrdered,
      count: data.draft.draft
        ? data.draft.draft.actor.eligibleTurnIds.length +
          data.trades.items.filter((trade) => trade.state === "proposed").length
        : undefined,
    },
    {
      value: "format",
      label: "Formato",
      icon: GitBranch,
      count: data.format.matches.items.length,
    },
    {
      value: "matches",
      label: "Jogos",
      icon: Goal,
      count: data.format.matches.items.filter((match) => Number(match.resultRevision) === 0).length,
    },
    { value: "statistics", label: "Estatísticas", icon: BarChart3 },
    {
      value: "archive",
      label: "Títulos e prêmios",
      icon: Trophy,
      count: Number(data.history.placements.totalCount) + Number(data.history.awards.totalCount),
    },
    { value: "activity", label: "Atividade", icon: Activity, count: data.audit.items.length },
  ];

  return (
    <nav className="border-b bg-card/35 px-3 py-3 xl:border-r xl:border-b-0 xl:px-2 xl:py-5">
      <div className="flex gap-1 overflow-x-auto xl:grid">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(item.value)}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm transition-colors xl:w-full ${
              view === item.value
                ? "border-border bg-muted text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <item.icon className="size-4" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.count !== undefined ? (
              <span className="text-xs tabular-nums">{item.count}</span>
            ) : null}
          </button>
        ))}
      </div>
    </nav>
  );
}

function SetupWorkspace({ data, isAdmin }: { data: ChampionshipWorkspaceData; isAdmin: boolean }) {
  return (
    <div className="space-y-6">
      <WorkspaceTitle
        title="Configuração da edição"
        description="Dados públicos, regras congeláveis, ciclo de vida e programas de sala."
        action={<LifecycleMenu data={data} disabled={!isAdmin} />}
      />
      {!isAdmin ? (
        <Alert>
          <AlertDescription>
            Você pode acompanhar e operar esta edição, mas alterações estruturais exigem
            administração de campeonatos.
          </AlertDescription>
        </Alert>
      ) : null}
      <ChampionshipDetailsForm data={data} disabled={!isAdmin} />
      <RoomProgramsPanel data={data} disabled={!isAdmin} />
      <RulesForm data={data} disabled={!isAdmin} />
    </div>
  );
}

function ChampionshipDetailsForm({
  data,
  disabled,
}: {
  data: ChampionshipWorkspaceData;
  disabled: boolean;
}) {
  const updateChampionship = useServerFn(updateChampionshipFn);
  const router = useRouter();
  const championship = data.championship;
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);

    try {
      const result = await updateChampionship({
        data: {
          championshipUuid: championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(championship.revision),
          name: formString(form, "name"),
          editionLabel: formNullable(form, "editionLabel"),
          description: formNullable(form, "description"),
          startsAt: localDateToIso(formNullable(form, "startsAt")),
          endsAt: localDateToIso(formNullable(form, "endsAt")),
          reason: "Atualização da configuração geral",
        },
      });

      if (!result.ok) {
        toast.error(conflictMessage(result));
        return;
      }

      toast.success("Configuração salva.");
      await router.invalidate();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <SectionHeader icon={Settings2} title="Identidade e calendário" />
      <form className="space-y-5 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Nome"
            name="name"
            defaultValue={championship.name}
            required
            disabled={disabled}
          />
          <FormField
            label="Edição"
            name="editionLabel"
            defaultValue={championship.editionLabel ?? ""}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="championshipDescription">Descrição pública</Label>
          <Textarea
            id="championshipDescription"
            name="description"
            rows={4}
            defaultValue={championship.description ?? ""}
            disabled={disabled}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Início"
            name="startsAt"
            type="datetime-local"
            defaultValue={isoToLocalDate(championship.startsAt)}
            disabled={disabled}
          />
          <FormField
            label="Fim"
            name="endsAt"
            type="datetime-local"
            defaultValue={isoToLocalDate(championship.endsAt)}
            disabled={disabled}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={disabled || busy}>
            <Save />
            {busy ? "Salvando…" : "Salvar dados"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function RulesForm({ data, disabled }: { data: ChampionshipWorkspaceData; disabled: boolean }) {
  const updateChampionship = useServerFn(updateChampionshipFn);
  const router = useRouter();
  const championship = data.championship;
  const rules = championship.rules;
  const [salaryEnabled, setSalaryEnabled] = useState(rules.salary.enabled);
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<"match" | "roster" | "salary" | "scheduling">("match");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);

    try {
      const result = await updateChampionship({
        data: {
          championshipUuid: championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(championship.revision),
          rules: {
            match: {
              sequentialRoundCount: formNumber(form, "periods"),
              switchSides: form.get("switchSides") === "on",
              drawPolicy: formString(form, "drawPolicy") as
                | "allowed"
                | "overtime"
                | "staff-decision",
              overtimePolicy: formString(form, "overtimePolicy") as
                | "disabled"
                | "manual"
                | "separate-period",
              overtimeRuleLabel: formNullable(form, "overtimeRuleLabel"),
              fullForfeitScore: {
                winner: formNumber(form, "forfeitWinner"),
                loser: formNumber(form, "forfeitLoser"),
              },
            },
            roster: {
              minimumSize: formNumber(form, "minimumSize"),
              maximumSize: formNumber(form, "maximumSize"),
              lockPolicy: formString(form, "lockPolicy") as
                | "unlocked"
                | "draft-start"
                | "competition-start",
            },
            salary: {
              enabled: salaryEnabled,
              capUnits: salaryEnabled
                ? formNumber(form, "capUnits")
                : Number(rules.salary.capUnits),
              displayLabel: salaryEnabled
                ? formString(form, "displayLabel")
                : rules.salary.displayLabel,
              maximumTradeDifference: salaryEnabled
                ? formNumber(form, "maximumTradeDifference")
                : Number(rules.salary.maximumTradeDifference),
            },
            draft: {
              rounds: formNumber(form, "draftRounds"),
              countdownSeconds: formNumber(form, "countdownSeconds"),
              publicPrices: form.get("publicPrices") === "on",
            },
            scheduling: {
              authority: formString(form, "schedulingAuthority") as
                | "staff"
                | "gms"
                | "staff-and-gms",
              proposalMode: formString(form, "proposalMode") as
                | "exact-time"
                | "availability-range"
                | "both",
              latePlayPolicy: formString(form, "latePlayPolicy") as
                | "forbidden"
                | "staff-approval"
                | "allowed",
            },
          },
          reason: "Atualização das regras da edição",
        },
      });

      if (!result.ok) {
        toast.error(conflictMessage(result));
        return;
      }

      toast.success("Regras atualizadas e nova revisão criada.");
      await router.invalidate();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <SectionHeader icon={ClipboardCheck} title="Regras da edição" />
      <form className="space-y-6 p-5" onSubmit={submit}>
        <div
          className="flex gap-1 overflow-x-auto border-b"
          role="tablist"
          aria-label="Seções das regras"
        >
          {(
            [
              ["match", "Partida"],
              ["roster", "Elenco e draft"],
              ["salary", "Teto salarial"],
              ["scheduling", "Agendamento"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={section === value}
              onClick={() => setSection(value)}
              className={`h-10 shrink-0 border-b-2 px-4 text-sm font-medium transition-colors ${
                section === value
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div hidden={section !== "match"} role="tabpanel">
          <RuleGroup title="Partida">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Tempos"
                name="periods"
                type="number"
                min={1}
                defaultValue={String(rules.match.sequentialRoundCount)}
                disabled={disabled}
              />
              <SelectField
                label="Empate"
                name="drawPolicy"
                defaultValue={rules.match.drawPolicy}
                disabled={disabled}
                options={[
                  ["allowed", "Permitido"],
                  ["overtime", "Prorrogação"],
                  ["staff-decision", "Decisão da organização"],
                ]}
              />
              <FormField
                label="W.O. vencedor"
                name="forfeitWinner"
                type="number"
                min={0}
                defaultValue={String(rules.match.fullForfeitScore.winner)}
                disabled={disabled}
              />
              <FormField
                label="W.O. perdedor"
                name="forfeitLoser"
                type="number"
                min={0}
                defaultValue={String(rules.match.fullForfeitScore.loser)}
                disabled={disabled}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Prorrogação"
                name="overtimePolicy"
                defaultValue={rules.match.overtimePolicy}
                disabled={disabled}
                options={[
                  ["disabled", "Desativada"],
                  ["separate-period", "Tempo separado"],
                  ["manual", "Decisão manual"],
                ]}
              />
              <FormField
                label="Regra da prorrogação"
                name="overtimeRuleLabel"
                defaultValue={rules.match.overtimeRuleLabel ?? ""}
                disabled={disabled}
              />
            </div>
            <ToggleRow
              name="switchSides"
              label="Trocar vermelho e azul entre tempos"
              defaultChecked={rules.match.switchSides}
              disabled={disabled}
            />
          </RuleGroup>
        </div>

        <div hidden={section !== "roster"} role="tabpanel">
          <RuleGroup title="Elenco e draft">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Mínimo"
                name="minimumSize"
                type="number"
                min={0}
                defaultValue={String(rules.roster.minimumSize)}
                disabled={disabled}
              />
              <FormField
                label="Máximo"
                name="maximumSize"
                type="number"
                min={0}
                defaultValue={String(rules.roster.maximumSize)}
                disabled={disabled}
              />
              <FormField
                label="Rodadas do draft"
                name="draftRounds"
                type="number"
                min={1}
                defaultValue={String(rules.draft.rounds)}
                disabled={disabled}
              />
              <FormField
                label="Contagem (segundos)"
                name="countdownSeconds"
                type="number"
                min={5}
                defaultValue={String(rules.draft.countdownSeconds)}
                disabled={disabled}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Travamento do elenco"
                name="lockPolicy"
                defaultValue={rules.roster.lockPolicy}
                disabled={disabled}
                options={[
                  ["unlocked", "Manual"],
                  ["draft-start", "Ao iniciar o draft"],
                  ["competition-start", "Ao iniciar o campeonato"],
                ]}
              />
              <ToggleRow
                name="publicPrices"
                label="Exibir valores publicamente"
                defaultChecked={rules.draft.publicPrices}
                disabled={disabled || !salaryEnabled}
              />
            </div>
          </RuleGroup>
        </div>

        <div hidden={section !== "salary"} role="tabpanel">
          <RuleGroup title="Teto salarial">
            <div className="flex items-center justify-between border p-3">
              <div>
                <Label htmlFor="salaryEnabled">Usar teto salarial</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Valores inteiros, congelados antes da atividade sujeita ao teto.
                </p>
              </div>
              <Switch
                id="salaryEnabled"
                checked={salaryEnabled}
                onCheckedChange={setSalaryEnabled}
                disabled={disabled}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Teto por equipe"
                name="capUnits"
                type="number"
                min={0}
                defaultValue={String(rules.salary.capUnits)}
                disabled={disabled || !salaryEnabled}
              />
              <FormField
                label="Unidade monetária (M = US$ 1 milhão)"
                name="displayLabel"
                defaultValue={rules.salary.displayLabel}
                disabled={disabled || !salaryEnabled}
              />
              <FormField
                label="Diferença máxima em troca"
                name="maximumTradeDifference"
                type="number"
                min={0}
                defaultValue={String(rules.salary.maximumTradeDifference)}
                disabled={disabled || !salaryEnabled}
              />
            </div>
          </RuleGroup>
        </div>

        <div hidden={section !== "scheduling"} role="tabpanel">
          <RuleGroup title="Agendamento">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Autoridade"
                name="schedulingAuthority"
                defaultValue={rules.scheduling.authority}
                disabled={disabled}
                options={[
                  ["staff", "Organização"],
                  ["gms", "GMs"],
                  ["staff-and-gms", "Organização e GMs"],
                ]}
              />
              <SelectField
                label="Propostas"
                name="proposalMode"
                defaultValue={rules.scheduling.proposalMode}
                disabled={disabled}
                options={[
                  ["exact-time", "Horário exato"],
                  ["availability-range", "Faixa de disponibilidade"],
                  ["both", "Ambos"],
                ]}
              />
              <SelectField
                label="Jogo atrasado"
                name="latePlayPolicy"
                defaultValue={rules.scheduling.latePlayPolicy}
                disabled={disabled}
                options={[
                  ["forbidden", "Proibido"],
                  ["staff-approval", "Com autorização"],
                  ["allowed", "Permitido"],
                ]}
              />
            </div>
          </RuleGroup>
        </div>

        <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end border-t bg-card/95 px-5 py-4 backdrop-blur">
          <Button type="submit" disabled={disabled || busy}>
            <Save />
            {busy ? "Salvando…" : "Salvar regras"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function LifecycleMenu({ data, disabled }: { data: ChampionshipWorkspaceData; disabled: boolean }) {
  const transition = useServerFn(transitionChampionshipFn);
  const router = useRouter();
  const championship = data.championship;
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const actions = lifecycleActions(championship.lifecycle, championship.visibility);

  async function run(next: (typeof actions)[number]) {
    setBusy(true);

    try {
      const result = await transition({
        data: {
          championshipUuid: championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(championship.revision),
          transition: next.transition,
          reason: next.reason,
        },
      });

      if (!result.ok) {
        toast.error(conflictMessage(result));
        return;
      }

      toast.success(`${next.label}.`);
      await router.invalidate();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const result = await transition({
        data: {
          championshipUuid: championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(championship.revision),
          transition: "delete",
          reason: "Exclusão solicitada pela administração",
        },
      });

      if (!result.ok) {
        toast.error(conflictMessage(result));
        return;
      }

      toast.success("Campeonato excluído.");
      setDeleteOpen(false);
      await router.navigate({ to: "/admin/championships" });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-44 justify-between">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400" />
              {championshipLifecycleLabel(championship.lifecycle)}
            </span>
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="space-y-1">
            <span className="block">Ciclo de vida</span>
            <span className="block text-xs font-normal text-muted-foreground">
              {championship.visibility === "public"
                ? "Página pública visível"
                : "Visível apenas para a organização"}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.transition}
              variant={action.transition === "cancel" ? "destructive" : "default"}
              disabled={disabled || busy}
              onSelect={(event) => {
                event.preventDefault();
                void run(action);
              }}
            >
              {action.transition === "publish" ? <Eye /> : null}
              {action.transition === "unpublish" ? <EyeOff /> : null}
              {action.transition === "activate" ? <Radio /> : null}
              {action.transition === "complete" ? <CheckCircle2 /> : null}
              {action.label}
            </DropdownMenuItem>
          ))}
          {!disabled ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={busy}
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 />
                Excluir campeonato
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteConfirmation("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {championship.name}?</DialogTitle>
            <DialogDescription>
              O campeonato desaparecerá das áreas públicas e administrativas. Seus dados e a
              auditoria serão preservados internamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="deleteChampionshipConfirmation">
              Digite <strong>{championship.name}</strong> para confirmar
            </Label>
            <Input
              id="deleteChampionshipConfirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy || deleteConfirmation !== championship.name}
              onClick={() => void remove()}
            >
              <Trash2 />
              {busy ? "Excluindo…" : "Excluir campeonato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoomProgramsPanel({
  data,
  disabled,
}: {
  data: ChampionshipWorkspaceData;
  disabled: boolean;
}) {
  const changeProgram = useServerFn(changeChampionshipRoomProgramFn);
  const router = useRouter();
  const championship = data.championship;
  const linkedIds = new Set(championship.roomPrograms.map((item) => item.uuid));
  const available = data.roomPrograms.items.filter((item) => !linkedIds.has(item.id));
  const [busy, setBusy] = useState(false);

  async function change(roomProgramId: string, operation: "add" | "set-default") {
    setBusy(true);

    try {
      const result = await changeProgram({
        data: {
          championshipUuid: championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(championship.revision),
          roomProgramId,
          operation,
        },
      });

      if (!result.ok) {
        toast.error(conflictMessage(result));
        return;
      }

      toast.success(operation === "add" ? "Programa autorizado." : "Programa padrão atualizado.");
      await router.invalidate();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <SectionHeader icon={Radio} title="Programas de sala" />
      <div className="space-y-3 p-5">
        {championship.roomPrograms.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum programa autorizado.</p>
        ) : (
          championship.roomPrograms.map((program) => (
            <div key={program.uuid} className="flex items-center gap-3 border p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{program.title ?? program.name}</div>
                <div className="text-xs text-muted-foreground">
                  {program.state === "active" ? "Ativo" : "Retirado"}
                </div>
              </div>
              {program.isDefault ? (
                <Badge>Padrão</Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled || busy}
                  onClick={() => void change(program.uuid, "set-default")}
                >
                  Tornar padrão
                </Button>
              )}
            </div>
          ))
        )}
        {available.length > 0 ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const value = formString(new FormData(event.currentTarget), "program");
              if (value) void change(value, "add");
            }}
          >
            <NativeSelect name="program" disabled={disabled || busy}>
              {available.map((program) => (
                <NativeSelectOption key={program.id} value={program.id}>
                  {program.title ?? program.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button type="submit" variant="outline" size="icon" title="Autorizar programa">
              <Plus />
            </Button>
          </form>
        ) : null}
      </div>
    </section>
  );
}

function TeamsWorkspace({ data, isAdmin }: { data: ChampionshipWorkspaceData; isAdmin: boolean }) {
  return (
    <div className="space-y-6">
      <WorkspaceTitle
        title="Equipes e identidades"
        description="Cada equipe pertence à edição e pode, opcionalmente, acumular títulos em uma identidade."
        action={
          isAdmin ? (
            <div className="flex gap-2">
              <CreateIdentityDialog data={data} />
              <CreateTeamDialog data={data} />
            </div>
          ) : null
        }
      />
      {data.teams.items.length === 0 ? (
        <div className="bfl-panel rounded-xl border px-6 py-16 text-center">
          <Shield className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhuma equipe colocada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie equipes manualmente agora; draft e alocação de jogadores entram na próxima área.
          </p>
        </div>
      ) : (
        <section className="bfl-panel overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipe</TableHead>
                <TableHead>Identidade</TableHead>
                <TableHead>Seed</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Revisão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.teams.items.map((team) => (
                <TableRow key={team.uuid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <TeamSwatch colors={team.colors} />
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {team.abbreviation ?? "Sem sigla"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{team.teamIdentity?.name ?? "Somente esta edição"}</TableCell>
                  <TableCell>{team.seed ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {team.state === "active"
                        ? "Ativa"
                        : team.state === "withdrawn"
                          ? "Desistente"
                          : "Desclassificada"}
                    </Badge>
                  </TableCell>
                  <TableCell>{team.revision}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
      <section className="bfl-panel overflow-hidden rounded-xl border">
        <SectionHeader icon={Trophy} title="Identidades de equipe" />
        <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-3">
          {data.teamIdentities.items.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              Nenhuma identidade recorrente criada.
            </p>
          ) : (
            data.teamIdentities.items.map((identity) => (
              <div key={identity.uuid} className="flex items-center gap-3 p-4">
                <TeamSwatch colors={identity.colors} />
                <div className="min-w-0">
                  <div className="truncate font-medium">{identity.name}</div>
                  <div className="text-xs text-muted-foreground">{identity.slug}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function CreateTeamDialog({ data }: { data: ChampionshipWorkspaceData }) {
  const createTeam = useServerFn(createChampionshipTeamFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);

    try {
      const identity = formString(form, "teamIdentityId");
      const result = await createTeam({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(data.championship.revision),
          teamIdentityId: identity || null,
          name: formString(form, "name"),
          abbreviation: formNullable(form, "abbreviation"),
          colors: [formString(form, "primaryColor"), formString(form, "secondaryColor")],
          seed: optionalFormNumber(form, "seed"),
          displayOrder: data.teams.items.length,
        },
      });

      if (!result.ok) {
        setMessage(conflictMessage(result));
        return;
      }

      setOpen(false);
      await router.invalidate();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <EntityDialog
      open={open}
      onOpenChange={setOpen}
      title="Nova equipe"
      description="A equipe é específica desta edição; a identidade é opcional."
      triggerLabel="Nova equipe"
    >
      <form className="space-y-4" onSubmit={submit}>
        {message ? <InlineMessage text={message} /> : null}
        <FormField label="Nome" name="name" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Sigla" name="abbreviation" />
          <FormField label="Seed" name="seed" type="number" min={1} />
        </div>
        <SelectField
          label="Identidade"
          name="teamIdentityId"
          defaultValue=""
          options={[
            ["", "Somente esta edição"],
            ...data.teamIdentities.items.map(
              (identity) => [identity.uuid, identity.name] as [string, string],
            ),
          ]}
        />
        <ColorFields />
        <DialogFooter>
          <Button type="submit" disabled={busy}>
            {busy ? "Criando…" : "Criar equipe"}
          </Button>
        </DialogFooter>
      </form>
    </EntityDialog>
  );
}

function CreateIdentityDialog({ data }: { data: ChampionshipWorkspaceData }) {
  const createIdentity = useServerFn(createTeamIdentityFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);

    try {
      const result = await createIdentity({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(data.championship.revision),
          slug: formString(form, "slug"),
          name: formString(form, "name"),
          abbreviation: formNullable(form, "abbreviation"),
          colors: [formString(form, "primaryColor"), formString(form, "secondaryColor")],
        },
      });

      if (!result.ok) {
        setMessage(conflictMessage(result));
        return;
      }

      setOpen(false);
      await router.invalidate();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <EntityDialog
      open={open}
      onOpenChange={setOpen}
      title="Nova identidade"
      description="Títulos de equipes de diferentes edições podem ser agregados nesta identidade."
      triggerLabel="Nova identidade"
      variant="outline"
    >
      <form className="space-y-4" onSubmit={submit}>
        {message ? <InlineMessage text={message} /> : null}
        <FormField label="Nome" name="name" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Identificador" name="slug" required />
          <FormField label="Sigla" name="abbreviation" />
        </div>
        <ColorFields />
        <DialogFooter>
          <Button type="submit" disabled={busy}>
            {busy ? "Criando…" : "Criar identidade"}
          </Button>
        </DialogFooter>
      </form>
    </EntityDialog>
  );
}

function ActivityWorkspace({ data }: { data: ChampionshipWorkspaceData }) {
  return (
    <div className="space-y-6">
      <WorkspaceTitle
        title="Atividade auditada"
        description="Toda mudança consequente preserva autoria, correlação, revisão e motivo."
      />
      <section className="bfl-panel overflow-hidden rounded-xl border">
        {data.audit.items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            Nenhuma atividade registrada.
          </p>
        ) : (
          <div className="divide-y">
            {data.audit.items.map((event) => (
              <div
                key={event.uuid}
                className="grid gap-3 px-5 py-4 md:grid-cols-[150px_minmax(0,1fr)_auto]"
              >
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(event.createdAt)}
                </div>
                <div className="min-w-0">
                  <div className="font-medium">{auditActionLabel(event.action)}</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {event.actor.accountName ?? actorKindLabel(event.actor.kind)} ·{" "}
                    {championshipTargetLabel(event.targetType)}
                    {event.reason ? ` · ${event.reason}` : ""}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">#{event.sequence}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WorkspaceInspector({
  data,
  session,
  view,
}: {
  data: ChampionshipWorkspaceData;
  session: ApiAccountSession;
  view: ChampionshipWorkspaceView;
}) {
  const presence = deduplicateChampionshipPresence(data.presence);

  return (
    <aside className="border-t bg-card/35 xl:border-t-0 xl:border-l">
      <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
        <InspectorSection title="Agora" icon={Radio}>
          {presence.length === 0 ? (
            <p className="text-xs text-muted-foreground">Só você neste contexto.</p>
          ) : (
            <div className="space-y-2">
              {presence.map((person) => (
                <div key={person.sessionUuid} className="flex items-center gap-2 text-sm">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span className="min-w-0 flex-1 truncate">{person.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {championshipContextLabel(person.contextType)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </InspectorSection>
        <InspectorSection title="Caixa de entrada" icon={CircleAlert}>
          {data.inbox.items.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma notificação.</p>
          ) : (
            <div className="space-y-2">
              {data.inbox.items.map((item) => (
                <InboxItem key={item.uuid} item={item} />
              ))}
            </div>
          )}
        </InspectorSection>
        <InspectorSection title="Discussões" icon={MessageSquareText}>
          <CreateThreadForm data={data} view={view} />
          <div className="mt-4 space-y-2">
            {data.threads.items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma discussão aberta.</p>
            ) : (
              data.threads.items.map((thread) => (
                <ThreadItem key={thread.uuid} data={data} thread={thread} />
              ))
            )}
          </div>
        </InspectorSection>
        <InspectorSection title="Responsabilidades" icon={ClipboardCheck}>
          <CreateAssignmentForm data={data} session={session} view={view} />
          <div className="mt-4 space-y-2">
            {data.assignments.items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma tarefa aberta.</p>
            ) : (
              data.assignments.items.map((assignment) => (
                <AssignmentItem key={assignment.uuid} data={data} assignment={assignment} />
              ))
            )}
          </div>
        </InspectorSection>
      </div>
    </aside>
  );
}

function CreateThreadForm({
  data,
  view,
}: {
  data: ChampionshipWorkspaceData;
  view: ChampionshipWorkspaceView;
}) {
  const createThread = useServerFn(createChampionshipThreadFn);
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);

    try {
      const result = await createThread({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(data.championship.revision),
          contextType: view,
          title: formNullable(form, "title"),
          body: formString(form, "body"),
        },
      });
      if (!result.ok) {
        setMessage(conflictMessage(result));
        return;
      }
      setExpanded(false);
      await router.invalidate();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" className="w-full" onClick={() => setExpanded(true)}>
        <Plus />
        Iniciar discussão
      </Button>
    );
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      {message ? <p className="text-xs text-red-300">{message}</p> : null}
      <Input name="title" placeholder="Assunto" />
      <Textarea name="body" placeholder="Escreva o primeiro comentário…" rows={3} required />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(false)}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={busy}>
          Publicar
        </Button>
      </div>
    </form>
  );
}

function CreateAssignmentForm({
  data,
  session,
  view,
}: {
  data: ChampionshipWorkspaceData;
  session: ApiAccountSession;
  view: ChampionshipWorkspaceView;
}) {
  const createAssignment = useServerFn(createChampionshipAssignmentFn);
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const result = await createAssignment({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(data.championship.revision),
          assigneeAccountUuid: session.account.uuid,
          contextType: view,
          title: formString(form, "title"),
        },
      });
      if (!result.ok) {
        setMessage(conflictMessage(result));
        return;
      }
      (event.currentTarget as HTMLFormElement).reset();
      await router.invalidate();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  return (
    <form className="flex gap-2" onSubmit={submit}>
      <div className="min-w-0 flex-1">
        <Input name="title" placeholder="Atribuir a mim…" required />
        {message ? <p className="mt-1 text-xs text-red-300">{message}</p> : null}
      </div>
      <Button type="submit" variant="outline" size="icon" title="Criar tarefa">
        <Plus />
      </Button>
    </form>
  );
}

function InboxItem({ item }: { item: ChampionshipWorkspaceData["inbox"]["items"][number] }) {
  const updateInbox = useServerFn(updateChampionshipInboxItemFn);
  const router = useRouter();

  async function update(operation: "read" | "unread" | "archive") {
    const result = await updateInbox({
      data: {
        inboxItemUuid: item.uuid,
        operation,
      },
    });
    if (result.ok) await router.invalidate();
  }

  return (
    <div className={`border p-3 ${item.readAt ? "opacity-70" : "border-amber-400/40"}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{item.title}</div>
          {item.body ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
          ) : null}
        </div>
        {!item.readAt ? <span className="mt-1 size-2 rounded-full bg-amber-300" /> : null}
      </div>
      <div className="mt-2 flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          title={item.readAt ? "Marcar como não lida" : "Marcar como lida"}
          onClick={() => void update(item.readAt ? "unread" : "read")}
        >
          <CheckCircle2 />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Arquivar notificação"
          onClick={() => void update("archive")}
        >
          <Archive />
        </Button>
      </div>
    </div>
  );
}

function ThreadItem({
  data,
  thread,
}: {
  data: ChampionshipWorkspaceData;
  thread: ChampionshipWorkspaceData["threads"]["items"][number];
}) {
  const addComment = useServerFn(addChampionshipCommentFn);
  const updateThread = useServerFn(updateChampionshipThreadFn);
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = formString(new FormData(event.currentTarget), "body");
    const result = await addComment({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: Number(data.championship.revision),
        threadUuid: thread.uuid,
        body,
      },
    });
    if (!result.ok) {
      setMessage(conflictMessage(result));
      return;
    }
    setReplying(false);
    await router.invalidate();
  }

  async function toggleResolution() {
    const result = await updateThread({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: Number(data.championship.revision),
        threadUuid: thread.uuid,
        state: thread.state === "open" ? "resolved" : "open",
      },
    });
    if (!result.ok) {
      setMessage(conflictMessage(result));
      return;
    }
    await router.invalidate();
  }

  return (
    <div
      className={`border-l-2 px-3 py-2 ${
        thread.state === "open" ? "border-sky-400" : "border-emerald-400 opacity-75"
      }`}
    >
      <div className="text-sm font-medium">
        {thread.title ?? thread.latestComment?.body ?? "Discussão"}
      </div>
      {thread.latestComment ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {thread.latestComment.author.name}: {thread.latestComment.body}
        </p>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{thread.commentCount} comentários</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setReplying((current) => !current)}>
            Responder
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Alternar resolução"
            onClick={() => void toggleResolution()}
          >
            <CheckCircle2 />
          </Button>
        </div>
      </div>
      {message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null}
      {replying ? (
        <form className="mt-2 flex gap-2" onSubmit={reply}>
          <Input name="body" placeholder="Resposta…" required />
          <Button type="submit" size="icon" title="Enviar resposta">
            <Send />
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function AssignmentItem({
  data,
  assignment,
}: {
  data: ChampionshipWorkspaceData;
  assignment: ChampionshipWorkspaceData["assignments"]["items"][number];
}) {
  const updateAssignment = useServerFn(updateChampionshipAssignmentFn);
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function update(state: "in-progress" | "completed") {
    const result = await updateAssignment({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: Number(data.championship.revision),
        assignmentUuid: assignment.uuid,
        state,
        reason: state === "completed" ? "Concluída pelo workspace" : "Trabalho iniciado",
      },
    });
    if (!result.ok) {
      setMessage(conflictMessage(result));
      return;
    }
    await router.invalidate();
  }

  return (
    <div className="border p-3">
      <div className="text-sm font-medium">{assignment.title}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        {assignment.assignee.name} · {assignmentStateLabel(assignment.state)}
      </div>
      {message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null}
      {assignment.state === "open" ? (
        <Button
          className="mt-2 w-full"
          variant="outline"
          size="sm"
          onClick={() => void update("in-progress")}
        >
          Iniciar
        </Button>
      ) : assignment.state === "in-progress" ? (
        <Button
          className="mt-2 w-full"
          variant="outline"
          size="sm"
          onClick={() => void update("completed")}
        >
          <CheckCircle2 />
          Concluir
        </Button>
      ) : null}
    </div>
  );
}

function useChampionshipPresence(
  championshipUuid: string,
  view: ChampionshipWorkspaceView,
  selectedMatchUuid: string | null,
) {
  const heartbeat = useServerFn(heartbeatChampionshipPresenceFn);
  const sessionUuid = useRef<string | null>(null);

  useEffect(() => {
    sessionUuid.current ??= crypto.randomUUID();

    function sendHeartbeat() {
      if (!sessionUuid.current) return;
      void heartbeat({
        data: {
          championshipUuid,
          sessionUuid: sessionUuid.current,
          contextType: view,
          ...(selectedMatchUuid ? { contextUuid: selectedMatchUuid } : {}),
        },
      });
    }

    sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, 20_000);
    return () => window.clearInterval(timer);
  }, [championshipUuid, heartbeat, selectedMatchUuid, view]);
}

function useChampionshipLiveUpdates(championshipUuid: string) {
  const router = useRouter();
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");

  useEffect(() => {
    const source = new EventSource(
      `/api/championships/${encodeURIComponent(championshipUuid)}/events`,
    );
    let refreshTimer: number | null = null;

    source.onopen = () => setStatus("live");
    source.onerror = () => setStatus("offline");
    source.addEventListener("championship-change", () => {
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        void router.invalidate();
      }, 150);
    });

    return () => {
      source.close();
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
    };
  }, [championshipUuid, router]);

  return status;
}

function useWorkspaceShortcuts(setOpen: (open: boolean) => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);
}

function useSavedWorkspaceView(
  savedViews: ChampionshipWorkspaceData["savedViews"]["items"],
  applyView: (state: { view: ChampionshipWorkspaceView; inspector: boolean }) => void,
) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("view")) return;

    const preference = savedViews.find((savedView) => savedView.isDefault);
    const state = savedViewState(preference?.state);
    if (!state) return;

    applyView(state);
  }, [applyView, savedViews]);
}

function WorkspaceCommandPalette({
  open,
  onOpenChange,
  championshipSlug,
  inspector,
  onSelectView,
  onToggleInspector,
  savedViews,
  onSaveDefault,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  championshipSlug: string;
  inspector: boolean;
  onSelectView: (view: ChampionshipWorkspaceView) => void;
  onToggleInspector: () => void;
  savedViews: ChampionshipWorkspaceData["savedViews"]["items"];
  onSaveDefault: () => void;
}) {
  function run(command: () => void) {
    command();
    onOpenChange(false);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Comandos do campeonato"
      description="Navegue e execute ações no contexto atual."
    >
      <CommandInput placeholder="Buscar seção ou comando…" />
      <CommandList>
        <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => run(() => onSelectView("setup"))}>
            <Settings2 />
            Configuração
            <CommandShortcut>G C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onSelectView("teams"))}>
            <Users />
            Equipes
            <CommandShortcut>G E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onSelectView("salary"))}>
            <CircleDollarSign />
            Elencos e teto
            <CommandShortcut>G T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onSelectView("draft"))}>
            <ListOrdered />
            Abrir draft e trocas
          </CommandItem>
          <CommandItem onSelect={() => run(() => onSelectView("format"))}>
            <GitBranch />
            Abrir formato
          </CommandItem>
          <CommandItem onSelect={() => run(() => onSelectView("matches"))}>
            <Goal />
            Operar jogos
          </CommandItem>
          <CommandItem onSelect={() => run(() => onSelectView("statistics"))}>
            <BarChart3 />
            Estatísticas oficiais
          </CommandItem>
          <CommandItem onSelect={() => run(() => onSelectView("archive"))}>
            <Trophy />
            Títulos e prêmios
          </CommandItem>
          <CommandItem onSelect={() => run(() => onSelectView("activity"))}>
            <Activity />
            Atividade
            <CommandShortcut>G A</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Vista">
          {savedViews.map((savedView) => {
            const state = savedViewState(savedView.state);
            if (!state) return null;

            return (
              <CommandItem
                key={savedView.uuid}
                onSelect={() =>
                  run(() => {
                    onSelectView(state.view);
                    if (state.inspector !== inspector) onToggleInspector();
                  })
                }
              >
                <FileClock />
                {savedView.name}
                {savedView.isDefault ? <CommandShortcut>Inicial</CommandShortcut> : null}
              </CommandItem>
            );
          })}
          <CommandItem onSelect={() => run(onToggleInspector)}>
            {inspector ? <PanelRightClose /> : <PanelRightOpen />}
            {inspector ? "Fechar painel lateral" : "Abrir painel lateral"}
          </CommandItem>
          <CommandItem onSelect={() => run(onSaveDefault)}>
            <Save />
            Salvar como vista inicial
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => {
                window.open(`/championships/${encodeURIComponent(championshipSlug)}`, "_blank");
              })
            }
          >
            <Eye />
            Abrir página pública
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function savedViewState(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    ![
      "setup",
      "teams",
      "salary",
      "draft",
      "format",
      "matches",
      "statistics",
      "archive",
      "activity",
    ].includes(String(record.view)) ||
    typeof record.inspector !== "boolean"
  ) {
    return null;
  }

  return {
    view: record.view as ChampionshipWorkspaceView,
    inspector: record.inspector,
  };
}

function WorkspaceTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: typeof Settings2; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b bg-muted/30 px-5 py-3">
      <Icon className="size-4 text-primary" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function InspectorSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Radio;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase">
        <Icon className="size-4 text-amber-300" />
        {title}
      </div>
      {children}
    </section>
  );
}

function RuleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t pt-5">
      <legend className="pr-3 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function ToggleRow({
  name,
  label,
  defaultChecked,
  disabled = false,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 border px-3 py-2 text-sm">
      <span>{label}</span>
      <input
        name={name}
        type="checkbox"
        aria-label={label}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="size-4"
      />
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  required = false,
  disabled = false,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        min={min}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  disabled = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: [string, string][];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <NativeSelect id={name} name={name} defaultValue={defaultValue} disabled={disabled}>
        {options.map(([value, optionLabel]) => (
          <NativeSelectOption key={value || "empty"} value={value}>
            {optionLabel}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

function ColorFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Cor principal" name="primaryColor" type="color" defaultValue="#22c55e" />
      <FormField label="Cor secundária" name="secondaryColor" type="color" defaultValue="#0f172a" />
    </div>
  );
}

function EntityDialog({
  open,
  onOpenChange,
  title,
  description,
  triggerLabel,
  variant = "default",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  triggerLabel: string;
  variant?: "default" | "outline";
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Plus />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function TeamSwatch({ colors }: { colors: string[] | null }) {
  return (
    <div
      className="size-9 shrink-0 border"
      style={{
        background: `linear-gradient(135deg, ${colors?.[0] ?? "#22c55e"} 0 50%, ${
          colors?.[1] ?? "#0f172a"
        } 50% 100%)`,
      }}
    />
  );
}

function InlineMessage({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-sm">
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-sky-300" />
      <span>{text}</span>
    </div>
  );
}

function lifecycleActions(
  lifecycle: ChampionshipWorkspaceData["championship"]["lifecycle"],
  visibility: ChampionshipWorkspaceData["championship"]["visibility"],
) {
  const actions: {
    transition: "publish" | "unpublish" | "activate" | "complete" | "archive" | "cancel";
    label: string;
    reason: string;
  }[] = [];

  if (visibility === "private" && lifecycle !== "archived") {
    actions.push({ transition: "publish", label: "Publicar edição", reason: "Publicação manual" });
  } else if (visibility === "public" && lifecycle === "setup") {
    actions.push({
      transition: "unpublish",
      label: "Retirar publicação",
      reason: "Retirada manual da publicação",
    });
  }
  if (lifecycle === "setup") {
    actions.push({ transition: "activate", label: "Iniciar campeonato", reason: "Início oficial" });
    actions.push({ transition: "cancel", label: "Cancelar edição", reason: "Cancelamento manual" });
  }
  if (lifecycle === "active") {
    actions.push({
      transition: "complete",
      label: "Concluir campeonato",
      reason: "Conclusão oficial",
    });
    actions.push({ transition: "cancel", label: "Cancelar edição", reason: "Cancelamento manual" });
  }
  if (lifecycle === "completed" || lifecycle === "canceled") {
    actions.push({
      transition: "archive",
      label: "Arquivar edição",
      reason: "Arquivamento manual",
    });
  }

  return actions;
}

function conflictMessage(result: {
  message: string;
  conflict?: { currentRevision?: number; currentChangeSequence?: number };
}) {
  if (!result.conflict) return result.message;
  return `${result.message} A edição avançou para a revisão ${
    result.conflict.currentRevision ?? "mais recente"
  }; recarregue para revisar as mudanças antes de tentar novamente.`;
}

function auditActionLabel(action: string) {
  const labels: Record<string, string> = {
    "assignment.created": "Responsabilidade atribuída",
    "championship.created": "Campeonato criado",
    "championship.updated": "Configuração atualizada",
    "championship.published": "Campeonato publicado",
    "championship.unpublished": "Publicação retirada",
    "championship.activated": "Campeonato iniciado",
    "championship.completed": "Campeonato concluído",
    "championship.canceled": "Campeonato cancelado",
    "championship.archived": "Campeonato arquivado",
    "comment.created": "Comentário publicado",
    "competition-type.created": "Tipo de competição criado",
    "competition-type.updated": "Tipo de competição atualizado",
    "draft.configured": "Draft configurado",
    "draft.ended": "Draft encerrado",
    "draft.pick-made": "Escolha realizada no draft",
    "draft.pick-reversed": "Escolha do draft desfeita",
    "draft.started": "Draft iniciado",
    "draft.turn-overdue": "Tempo de escolha esgotado",
    "format.classification.applied": "Classificação aplicada",
    "format.group.created": "Grupo criado",
    "format.round-robin.generated": "Jogos da fase gerados",
    "format.standings.configured": "Critérios de classificação atualizados",
    "history.award.corrected": "Premiação corrigida",
    "history.award.created": "Premiação registrada",
    "history.import.applied": "Importação histórica aplicada",
    "history.import.rolled-back": "Importação histórica desfeita",
    "history.placements.replaced": "Classificação final atualizada",
    "history.player.linked": "Jogador histórico vinculado",
    "match.attributions.updated": "Atribuições do jogo atualizadas",
    "match.evidence.attached": "Registro de sala associado",
    "match.evidence.detached": "Registro de sala desvinculado",
    "participant.self-registered": "Jogador inscrito",
    "participant.self-withdrew": "Inscrição retirada pelo jogador",
    "participant.staff-registered": "Jogador inscrito pela organização",
    "participant.status-changed": "Situação do participante atualizada",
    "roster.staff-moved": "Elenco alterado pela organização",
    "salary.prices-frozen": "Valores salariais congelados",
    "salary.prices-upserted": "Valores salariais atualizados",
    "schedule.late-play.authorized": "Jogo atrasado autorizado",
    "schedule.late-play.revoked": "Autorização de jogo atrasado retirada",
    "schedule.proposal.created": "Proposta de horário criada",
    "schedule.reminder.sent": "Lembrete de agendamento enviado",
    "statistics.metric-mappings.replaced": "Mapeamento de estatísticas atualizado",
    "team.created": "Equipe criada",
    "team.updated": "Equipe atualizada",
    "team-identity.created": "Identidade de equipe criada",
    "team-identity.updated": "Identidade de equipe atualizada",
    "thread.created": "Discussão iniciada",
    "trade.accepted": "Troca aceita",
    "trade.proposed": "Troca proposta",
    "trades.expired": "Trocas expiradas",
  };
  return labels[action] ?? "Atividade registrada";
}

function actorKindLabel(kind: string) {
  return (
    {
      account: "Conta",
      system: "Sistema",
      migration: "Importação",
    }[kind] ?? "Sistema"
  );
}

function assignmentStateLabel(
  state: ChampionshipWorkspaceData["assignments"]["items"][number]["state"],
) {
  return {
    open: "aberta",
    "in-progress": "em andamento",
    completed: "concluída",
    canceled: "cancelada",
  }[state];
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function isoToLocalDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function localDateToIso(value: string | null) {
  return value ? new Date(value).toISOString() : null;
}

function formString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formNullable(form: FormData, key: string) {
  return formString(form, key) || null;
}

function formNumber(form: FormData, key: string) {
  return Number(formString(form, key));
}

function optionalFormNumber(form: FormData, key: string) {
  const value = formString(form, key);
  return value ? Number(value) : null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}
