import { useMemo, useState, type FormEvent } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CircleAlert, Plus, Settings2, ShieldCheck, Trophy } from "lucide-react";
import { PageHeader } from "#/components/ds/app-shell";
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
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Textarea } from "#/components/ui/textarea";
import {
  cadenceLabel,
  championshipDateRange,
  championshipLifecycleLabel,
  championshipLifecycleTone,
} from "#/features/championships/championship-labels";
import type { ChampionshipAdminIndexData } from "#/server/api/championship-api";
import { createChampionshipFn, createCompetitionTypeFn } from "#/server/api/championship-functions";
import { defaultChampionshipRules } from "./default-rules";

export function ChampionshipAdminIndexPage({ data }: { data: ChampionshipAdminIndexData }) {
  const active = data.championships.items.filter((item) => item.lifecycle === "active").length;
  const privateSetups = data.championships.items.filter(
    (item) => item.lifecycle === "setup" && item.visibility === "private",
  ).length;
  const registrationOpen = data.championships.items.filter(
    (item) => item.registrationState === "open",
  ).length;

  return (
    <>
      <PageHeader
        title="Campeonatos"
        description="Configure edições, formatos, equipes e a operação competitiva em um só lugar."
        action={
          <div className="flex gap-2">
            <CompetitionTypesDialog data={data} />
            <CreateChampionshipDialog data={data} />
          </div>
        }
      />

      <div className="mb-6 grid border-y bg-card/50 sm:grid-cols-3">
        <AttentionMetric
          icon={Trophy}
          value={active}
          label="Em andamento"
          tone="text-emerald-300"
        />
        <AttentionMetric
          icon={CircleAlert}
          value={privateSetups}
          label="Preparações privadas"
          tone="text-amber-300"
        />
        <AttentionMetric
          icon={ShieldCheck}
          value={registrationOpen}
          label="Com inscrições abertas"
          tone="text-sky-300"
        />
      </div>

      <section className="border-y bg-card/60">
        <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Edições</h2>
            <p className="text-xs text-muted-foreground">
              {data.championships.items.length} campeonatos carregados
            </p>
          </div>
          <Badge variant="outline">Atualização por revisão</Badge>
        </div>

        {data.championships.items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Trophy className="mx-auto size-8 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">Comece pela primeira edição</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre um tipo de competição e abra o campeonato no modo de preparação.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campeonato</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Publicação</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Abrir</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.championships.items.map((championship) => (
                <TableRow key={championship.uuid}>
                  <TableCell>
                    <div className="font-medium">{championship.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {championship.editionLabel ?? championship.slug}
                    </div>
                  </TableCell>
                  <TableCell>{championship.competitionType.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {championshipDateRange(championship.startsAt, championship.endsAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={championshipLifecycleTone(championship.lifecycle)}
                    >
                      {championshipLifecycleLabel(championship.lifecycle)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {championship.visibility === "public" ? "Público" : "Privado"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="icon" title="Abrir campeonato">
                      <Link
                        to="/admin/championships/$championshipId"
                        params={{ championshipId: championship.uuid }}
                        search={{ view: "setup", inspector: true }}
                      >
                        <ArrowRight />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </>
  );
}

function AttentionMetric({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Trophy;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-4 border-b px-5 py-4 sm:border-r sm:border-b-0">
      <Icon className={`size-5 ${tone}`} />
      <div>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function CreateChampionshipDialog({ data }: { data: ChampionshipAdminIndexData }) {
  const createChampionship = useServerFn(createChampionshipFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const programs = data.roomPrograms.items;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const startsAt = optionalIso(form.get("startsAt"));
    const endsAt = optionalIso(form.get("endsAt"));
    const roomProgramId = stringValue(form.get("roomProgramId")) || undefined;

    try {
      const result = await createChampionship({
        data: {
          commandUuid: crypto.randomUUID(),
          competitionTypeId: stringValue(form.get("competitionTypeId")),
          slug: stringValue(form.get("slug")),
          name: stringValue(form.get("name")),
          editionLabel: nullableValue(form.get("editionLabel")),
          description: nullableValue(form.get("description")),
          startsAt,
          endsAt,
          historical: form.get("historical") === "on",
          ...(roomProgramId
            ? { roomProgramIds: [roomProgramId], defaultRoomProgramId: roomProgramId }
            : {}),
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setOpen(false);
      await router.navigate({
        to: "/admin/championships/$championshipId",
        params: { championshipId: result.data.uuid },
        search: { view: "setup", inspector: true },
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar o campeonato.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Nova edição
        </Button>
      </DialogTrigger>
      <DialogContent className="grid max-h-[min(860px,calc(100vh-2rem))] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar campeonato</DialogTitle>
          <DialogDescription>
            A edição começa privada e em preparação. As regras são copiadas do tipo escolhido.
          </DialogDescription>
        </DialogHeader>
        <form className="bfl-scrollbar space-y-5 overflow-y-auto pr-1" onSubmit={submit}>
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" name="name" placeholder="Copa de Inverno" required />
            <Field label="Identificador" name="slug" placeholder="copa-de-inverno-2026" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="competitionTypeId">Tipo de competição</Label>
              <NativeSelect id="competitionTypeId" name="competitionTypeId" required>
                <NativeSelectOption value="">Selecione</NativeSelectOption>
                {data.competitionTypes.items
                  .filter((type) => type.state === "active")
                  .map((type) => (
                    <NativeSelectOption key={type.uuid} value={type.uuid}>
                      {type.name}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
            </div>
            <Field label="Edição" name="editionLabel" placeholder="8ª edição" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição pública</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Início" name="startsAt" type="datetime-local" />
            <Field label="Fim" name="endsAt" type="datetime-local" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roomProgramId">Programa de sala padrão</Label>
            <NativeSelect id="roomProgramId" name="roomProgramId">
              <NativeSelectOption value="">Definir depois</NativeSelectOption>
              {programs.map((program) => (
                <NativeSelectOption key={program.id} value={program.id}>
                  {program.title ?? program.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex items-start gap-3 border p-3 text-sm">
            <input
              id="historical"
              name="historical"
              type="checkbox"
              aria-label="Edição histórica"
              className="mt-0.5 size-4"
            />
            <span>
              <strong className="block">Edição histórica</strong>
              <span className="text-xs text-muted-foreground">
                Permite reconstrução parcial e preservação explícita de dados desconhecidos.
              </span>
            </span>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || data.competitionTypes.items.length === 0}>
              {busy ? "Criando…" : "Criar edição"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CompetitionTypesDialog({ data }: { data: ChampionshipAdminIndexData }) {
  const createType = useServerFn(createCompetitionTypeFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const sortedTypes = useMemo(
    () => [...data.competitionTypes.items].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [data.competitionTypes.items],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);

    try {
      const result = await createType({
        data: {
          commandUuid: crypto.randomUUID(),
          slug: stringValue(form.get("slug")),
          name: stringValue(form.get("name")),
          description: nullableValue(form.get("description")),
          cadence: (stringValue(form.get("cadence")) || null) as
            | "long-running"
            | "multi-day"
            | "single-event"
            | null,
          defaultRules: defaultChampionshipRules,
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      (event.currentTarget as HTMLFormElement).reset();
      setMessage("Tipo criado. Ele já pode ser usado por novas edições.");
      await router.invalidate();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar o tipo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 />
          Tipos
        </Button>
      </DialogTrigger>
      <DialogContent className="grid max-h-[min(820px,calc(100vh-2rem))] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tipos de competição</DialogTitle>
          <DialogDescription>
            Os nomes são configuráveis. A cadência serve apenas para organizar a experiência.
          </DialogDescription>
        </DialogHeader>
        <div className="bfl-scrollbar grid gap-6 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="divide-y border">
            {sortedTypes.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">Nenhum tipo cadastrado.</div>
            ) : (
              sortedTypes.map((type) => (
                <div key={type.uuid} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{type.name}</div>
                    <Badge variant={type.state === "active" ? "outline" : "secondary"}>
                      {type.state === "active" ? "Ativo" : "Arquivado"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {cadenceLabel(type.cadence) ?? "Sem cadência padrão"} · revisão {type.revision}
                  </div>
                </div>
              ))
            )}
          </div>
          <form className="space-y-4 border-l pl-5" onSubmit={submit}>
            <div>
              <h3 className="font-semibold">Novo tipo</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Começa com regras adequadas para copas de dois tempos.
              </p>
            </div>
            {message ? (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}
            <Field label="Nome" name="name" placeholder="Copa" required />
            <Field label="Identificador" name="slug" placeholder="copa" required />
            <div className="space-y-2">
              <Label htmlFor="cadence">Cadência</Label>
              <NativeSelect id="cadence" name="cadence">
                <NativeSelectOption value="">Sem padrão</NativeSelectOption>
                <NativeSelectOption value="multi-day">Vários dias</NativeSelectOption>
                <NativeSelectOption value="long-running">Contínua</NativeSelectOption>
                <NativeSelectOption value="single-event">Um evento</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="typeDescription">Descrição</Label>
              <Textarea id="typeDescription" name="description" rows={3} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              <Plus />
              {busy ? "Criando…" : "Criar tipo"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} placeholder={placeholder} type={type} required={required} />
    </div>
  );
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableValue(value: FormDataEntryValue | null) {
  const parsed = stringValue(value);
  return parsed || null;
}

function optionalIso(value: FormDataEntryValue | null) {
  const parsed = stringValue(value);
  return parsed ? new Date(parsed).toISOString() : null;
}
