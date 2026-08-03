import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Scissors } from "lucide-react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { toast } from "sonner";
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
import { createClipFn, getClipConfigurationFn } from "#/server/api/functions";
import { type MatchRecordingOption } from "../utils/match-recordings";

const ReplayPlayer = lazy(() => import("./replay-player"));
const FRAME_RATE = 60;
const DEFAULT_MAX_DURATION_SECONDS = 30;

export function ClipCreatorDialog({ recording }: { recording: MatchRecordingOption }) {
  const navigate = useNavigate();
  const getClipConfiguration = useServerFn(getClipConfigurationFn);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [totalFrames, setTotalFrames] = useState(1);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState(DEFAULT_MAX_DURATION_SECONDS);
  const [startTick, setStartTick] = useState(0);
  const [endTick, setEndTick] = useState(1);
  const [currentTick, setCurrentTick] = useState(0);
  const [saving, setSaving] = useState(false);
  const [playerWindow, setPlayerWindow] = useState<FrameWindow | null>(null);
  const [seekRequest, setSeekRequest] = useState<number | undefined>(undefined);
  const editorStateRef = useRef({ currentTick, endTick, startTick, totalFrames });
  editorStateRef.current = { currentTick, endTick, startTick, totalFrames };

  const updateRange = useCallback(
    (nextStart: number, nextEnd: number) => {
      const safeStart = clamp(nextStart, 0, Math.max(0, totalFrames - 1));
      const safeEnd = clamp(nextEnd, safeStart + 1, totalFrames);

      setStartTick(safeStart);
      setEndTick(safeEnd);
    },
    [totalFrames],
  );

  const maxDurationFrames = maxDurationSeconds * FRAME_RATE;
  const selectionDuration = Math.max(0, endTick - startTick);
  const hasReadyReplay = totalFrames > 1;

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle("");
    setTotalFrames(1);
    setMaxDurationSeconds(DEFAULT_MAX_DURATION_SECONDS);
    setStartTick(0);
    setEndTick(1);
    setCurrentTick(0);
    setSaving(false);
    setPlayerWindow(null);
    setSeekRequest(undefined);
  }, [open, recording.id]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    void getClipConfiguration()
      .then((configuration) => {
        if (!active || !configuration) {
          return;
        }

        const configuredSeconds = Number(configuration.maxDurationSeconds);
        if (Number.isFinite(configuredSeconds)) {
          setMaxDurationSeconds(Math.max(1, Math.floor(configuredSeconds)));
        }
      })
      .catch(() => {
        // The server keeps the same default when the configuration is unavailable.
      });

    return () => {
      active = false;
    };
  }, [getClipConfiguration, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleShortcut(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const {
        currentTick: playhead,
        endTick: currentEnd,
        startTick: currentStart,
        totalFrames: total,
      } = editorStateRef.current;
      const step = event.shiftKey ? FRAME_RATE : 1;

      if (event.key === "i") {
        event.preventDefault();
        updateRange(Math.min(playhead, currentEnd - 1), currentEnd);
      } else if (event.key === "o") {
        event.preventDefault();
        updateRange(currentStart, Math.max(playhead, currentStart + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentTick((value) => clamp(value - step, 0, total));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentTick((value) => clamp(value + step, 0, total));
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [open, updateRange]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (startTick >= endTick || endTick > totalFrames) {
      toast.error("Escolha uma janela válida para o clipe.");
      return;
    }

    if (selectionDuration > maxDurationFrames) {
      toast.error(`O tamanho máximo deste clipe é de ${maxDurationSeconds} segundos.`);
      return;
    }

    setSaving(true);

    try {
      const result = await createClipFn({
        data: {
          recordingId: recording.id,
          startTick,
          endTick,
          title: title.trim() || undefined,
        },
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Clipe criado.");
      setOpen(false);
      await navigate({ to: "/clips/$clipId", params: { clipId: result.clip.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o clipe.");
    } finally {
      setSaving(false);
    }
  }

  function commitSelection(nextStart: number, nextEnd: number) {
    if (!hasReadyReplay || nextStart >= nextEnd) {
      return;
    }

    setPlayerWindow({ startFrame: nextStart, endFrame: nextEnd });
    setSeekRequest(nextStart);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Scissors className="size-4" />
          Criar clipe
        </Button>
      </DialogTrigger>
      <DialogContent className="!flex h-[min(94dvh,900px)] max-h-[calc(100dvh-1rem)] w-[min(96vw,1440px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:!max-w-none">
        <DialogHeader className="shrink-0 border-b bg-muted/20 px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex items-center gap-3 pr-8">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <Scissors className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl sm:text-2xl">Criar clipe</DialogTitle>
              <DialogDescription className="mt-1 truncate text-sm">
                {recording.label}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="clip-editor-form" onSubmit={handleSubmit} className="min-h-0 flex-1">
          <div className="h-full overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
            <div className="mx-auto max-w-[1180px]">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1419] shadow-2xl shadow-black/20">
                <Suspense
                  fallback={
                    <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Preparando a prévia…
                    </div>
                  }
                >
                  <ReplayPlayer
                    source={recording.url}
                    className="clip-editor-player"
                    frameWindow={playerWindow ?? undefined}
                    seekFrame={seekRequest}
                    onReady={(info) => {
                      const frames = Math.max(1, info.totalFrames);
                      const initialEnd =
                        endTick <= 1
                          ? Math.min(frames, maxDurationFrames)
                          : Math.min(endTick, frames);
                      setTotalFrames(frames);
                      setEndTick(initialEnd);
                      setPlayerWindow(
                        (value) => value ?? { startFrame: startTick, endFrame: initialEnd },
                      );
                      setSeekRequest((value) => value ?? startTick);
                    }}
                    onFrameChange={(frame) => setCurrentTick(Math.max(0, frame))}
                  />
                </Suspense>
                <div className="pointer-events-none absolute inset-x-3 bottom-[4.1rem] z-20 sm:inset-x-5">
                  <ClipTimeline
                    totalFrames={totalFrames}
                    startFrame={startTick}
                    endFrame={endTick}
                    currentFrame={currentTick}
                    maxDurationSeconds={maxDurationSeconds}
                    disabled={saving || !hasReadyReplay}
                    onCurrentFrameChange={(frame) => {
                      setCurrentTick(frame);
                      setSeekRequest(frame);
                    }}
                    onRangeChange={updateRange}
                    onRangeCommit={commitSelection}
                  />
                </div>
              </div>

              <div className="mt-5 max-w-xl">
                <Label htmlFor="clip-title">
                  Nome do clipe{" "}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="clip-title"
                  className="mt-2"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: touchdown no último segundo"
                  maxLength={120}
                  disabled={saving}
                />
                <div className="mt-1 flex justify-end text-xs tabular-nums text-muted-foreground">
                  {title.length}/120
                </div>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 border-t bg-background/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              form="clip-editor-form"
              type="submit"
              disabled={
                saving ||
                !hasReadyReplay ||
                startTick >= endTick ||
                endTick > totalFrames ||
                selectionDuration > maxDurationFrames
              }
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Scissors className="size-4" />
              )}
              {saving ? "Salvando…" : "Salvar clipe"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FrameWindow {
  startFrame: number;
  endFrame: number;
}

function ClipTimeline({
  totalFrames,
  startFrame,
  endFrame,
  currentFrame,
  maxDurationSeconds,
  disabled,
  onCurrentFrameChange,
  onRangeChange,
  onRangeCommit,
}: {
  totalFrames: number;
  startFrame: number;
  endFrame: number;
  currentFrame: number;
  maxDurationSeconds: number;
  disabled: boolean;
  onCurrentFrameChange: (frame: number) => void;
  onRangeChange: (startFrame: number, endFrame: number) => void;
  onRangeCommit: (startFrame: number, endFrame: number) => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"start" | "end" | "range" | null>(null);
  const rangeDragOriginRef = useRef<{
    pointerFrame: number;
    startFrame: number;
    endFrame: number;
  } | null>(null);
  const rangeRef = useRef({ startFrame, endFrame });
  rangeRef.current = { startFrame, endFrame };
  const safeTotal = Math.max(1, totalFrames);
  const ticks = useMemo(() => buildTimelineTicks(safeTotal), [safeTotal]);
  const selectionDuration = Math.max(0, endFrame - startFrame);
  const withinLimit = selectionDuration <= maxDurationSeconds * FRAME_RATE;

  function frameAtPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = timelineRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0) {
      return 0;
    }

    return clamp(
      Math.round(((event.clientX - bounds.left) / bounds.width) * safeTotal),
      0,
      safeTotal,
    );
  }

  function handleTrackPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    onCurrentFrameChange(frameAtPointer(event));
  }

  function emitRange(nextStart: number, nextEnd: number) {
    rangeRef.current = { startFrame: nextStart, endFrame: nextEnd };
    onRangeChange(nextStart, nextEnd);
  }

  function beginDrag(side: "start" | "end", event: ReactPointerEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragRef.current = side;
    rangeDragOriginRef.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function beginRangeDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragRef.current = "range";
    rangeDragOriginRef.current = {
      pointerFrame: frameAtPointer(event),
      startFrame,
      endFrame,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const side = dragRef.current;
    if (!side || disabled) {
      return;
    }

    const frame = frameAtPointer(event);
    const currentRange = rangeRef.current;
    if (side === "start") {
      emitRange(Math.min(frame, currentRange.endFrame - 1), currentRange.endFrame);
    } else if (side === "end") {
      emitRange(currentRange.startFrame, Math.max(frame, currentRange.startFrame + 1));
    } else if (rangeDragOriginRef.current) {
      const origin = rangeDragOriginRef.current;
      const duration = origin.endFrame - origin.startFrame;
      const nextStart = clamp(
        origin.startFrame + frame - origin.pointerFrame,
        0,
        Math.max(0, safeTotal - duration),
      );
      emitRange(nextStart, nextStart + duration);
    }
  }

  function endDrag() {
    if (dragRef.current) {
      onRangeCommit(rangeRef.current.startFrame, rangeRef.current.endFrame);
    }
    dragRef.current = null;
    rangeDragOriginRef.current = null;
  }

  function handleHandleKeyDown(
    side: "start" | "end",
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) {
    const step = event.shiftKey ? FRAME_RATE : 1;
    let nextFrame = side === "start" ? startFrame : endFrame;

    if (event.key === "ArrowLeft") nextFrame -= step;
    else if (event.key === "ArrowRight") nextFrame += step;
    else if (event.key === "Home") nextFrame = 0;
    else if (event.key === "End") nextFrame = safeTotal;
    else return;

    event.preventDefault();
    if (side === "start") {
      const safeStart = Math.min(nextFrame, endFrame - 1);
      emitRange(safeStart, endFrame);
      onRangeCommit(safeStart, endFrame);
    } else {
      const safeEnd = Math.max(nextFrame, startFrame + 1);
      emitRange(startFrame, safeEnd);
      onRangeCommit(startFrame, safeEnd);
    }
  }

  const selectionLeft = `${(startFrame / safeTotal) * 100}%`;
  const selectionWidth = `${((endFrame - startFrame) / safeTotal) * 100}%`;
  const endLeft = `${(endFrame / safeTotal) * 100}%`;
  const playheadLeft = `${(clamp(currentFrame, 0, safeTotal) / safeTotal) * 100}%`;

  return (
    <div
      className="pointer-events-auto rounded-xl border border-white/15 bg-[#0d1419]/95 px-3 py-2.5 shadow-2xl shadow-black/30 backdrop-blur-md sm:px-4"
      aria-label="Janela de corte"
    >
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="font-semibold uppercase tracking-[0.14em] text-white/75">
          Janela de corte
        </span>
        <span
          className={
            withinLimit
              ? "font-semibold tabular-nums text-primary"
              : "font-semibold tabular-nums text-amber-300"
          }
        >
          {formatClipDuration(selectionDuration)} / {maxDurationSeconds}s
        </span>
      </div>

      <div className="mt-1.5 px-1">
        <div className="relative h-4 text-[9px] tabular-nums text-white/55">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${(tick / safeTotal) * 100}%` }}
            >
              {formatClipTicks(tick)}
            </span>
          ))}
        </div>

        <div
          ref={timelineRef}
          className="relative h-9 touch-none rounded-lg border border-white/15 bg-black/35 shadow-inner"
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={(event) => {
            if (event.buttons === 0) endDrag();
          }}
          aria-label="Seleção de intervalo"
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/15" />
          <div
            className={
              withinLimit
                ? "absolute top-1/2 h-3 -translate-y-1/2 cursor-grab rounded-full bg-primary/85 shadow-[0_0_0_2px_color-mix(in_oklch,var(--primary)_25%,transparent)] active:cursor-grabbing"
                : "absolute top-1/2 h-3 -translate-y-1/2 cursor-grab rounded-full bg-amber-300/80 shadow-[0_0_0_2px_rgb(252_211_77_/_25%)] active:cursor-grabbing"
            }
            style={{ left: selectionLeft, width: selectionWidth }}
            onPointerDown={beginRangeDrag}
          />
          <div
            className="pointer-events-none absolute inset-y-1 w-px bg-white shadow-[0_0_0_1px_rgb(0_0_0_/_50%)]"
            style={{ left: playheadLeft }}
          />
          <TimelineHandle
            label="Início do clipe"
            value={startFrame}
            max={safeTotal}
            left={selectionLeft}
            disabled={disabled}
            onPointerDown={(event) => beginDrag("start", event)}
            onKeyDown={(event) => handleHandleKeyDown("start", event)}
          />
          <TimelineHandle
            label="Fim do clipe"
            value={endFrame}
            max={safeTotal}
            left={endLeft}
            disabled={disabled}
            onPointerDown={(event) => beginDrag("end", event)}
            onKeyDown={(event) => handleHandleKeyDown("end", event)}
          />
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] tabular-nums">
        <span className="font-semibold text-white/85">
          {formatClipTicks(startFrame)} — {formatClipTicks(endFrame)}
        </span>
        <span className={withinLimit ? "text-white/55" : "text-amber-300"}>
          {withinLimit ? "Pronto para salvar" : `Reduza para até ${maxDurationSeconds}s`}
        </span>
      </div>
    </div>
  );
}

function TimelineHandle({
  label,
  value,
  max,
  left,
  disabled,
  onPointerDown,
  onKeyDown,
}: {
  label: string;
  value: number;
  max: number;
  left: string;
  disabled: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className="absolute top-1/2 z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-primary bg-background text-primary shadow-lg transition-transform hover:scale-110 focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
      style={{ left }}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={formatClipTicks(value)}
      title={`${label}: ${formatClipTicks(value)}`}
    >
      <span className="h-3 w-1 rounded-full bg-primary" />
    </button>
  );
}

function buildTimelineTicks(totalFrames: number) {
  const step = niceTickStep(totalFrames);
  const ticks = [];
  for (let frame = 0; frame < totalFrames; frame += step) {
    ticks.push(frame);
  }
  if (ticks[ticks.length - 1] !== totalFrames) ticks.push(totalFrames);
  return ticks;
}

function niceTickStep(totalFrames: number) {
  const seconds = totalFrames / FRAME_RATE;
  if (seconds <= 30) return FRAME_RATE * 5;
  if (seconds <= 120) return FRAME_RATE * 15;
  if (seconds <= 600) return FRAME_RATE * 60;
  return FRAME_RATE * 300;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function formatClipTicks(ticks: number) {
  const seconds = Math.max(0, Math.floor(ticks)) / FRAME_RATE;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatClipDuration(ticks: number) {
  const seconds = Math.max(0, Math.floor(ticks)) / FRAME_RATE;
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}
