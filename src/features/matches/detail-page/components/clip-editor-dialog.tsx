import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pause, Play, Scissors } from "lucide-react";
import {
  lazy,
  Suspense,
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
  const [previewWindow, setPreviewWindow] = useState<FrameWindow | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [seekRequest, setSeekRequest] = useState<number | undefined>(undefined);
  const editorStateRef = useRef({ currentTick, endTick, startTick, totalFrames });
  editorStateRef.current = { currentTick, endTick, startTick, totalFrames };

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
    setPreviewWindow(null);
    setPreviewing(false);
    setPreviewKey(0);
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

        setMaxDurationSeconds(Math.max(1, configuration.maxDurationSeconds));
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
  }, [maxDurationFrames, open]);

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

  function updateRange(nextStart: number, nextEnd: number) {
    const safeStart = clamp(nextStart, 0, Math.max(0, totalFrames - 1));
    const safeEnd = clamp(
      nextEnd,
      safeStart + 1,
      Math.min(totalFrames, safeStart + maxDurationFrames),
    );

    setStartTick(safeStart);
    setEndTick(safeEnd);
  }

  function previewSelection() {
    if (!hasReadyReplay) {
      return;
    }

    setPreviewWindow({ startFrame: startTick, endFrame: endTick });
    setSeekRequest(startTick);
    setPreviewing(true);
    setPreviewKey((value) => value + 1);
  }

  function stopPreview() {
    setPreviewing(false);
    setPreviewKey((value) => value + 1);
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
              <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1419] shadow-2xl shadow-black/20">
                <div className="relative aspect-video">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Preparando a prévia…
                      </div>
                    }
                  >
                    <ReplayPlayer
                      key={`${recording.id}-${previewKey}`}
                      source={recording.url}
                      autoPlay={previewing}
                      frameWindow={previewWindow ?? undefined}
                      seekFrame={seekRequest}
                      onReady={(info) => {
                        const frames = Math.max(1, info.totalFrames);
                        setTotalFrames(frames);
                        setEndTick((value) =>
                          value <= 1
                            ? Math.min(frames, maxDurationFrames)
                            : Math.min(value, frames, maxDurationFrames),
                        );
                      }}
                      onFrameChange={(frame) => setCurrentTick(Math.max(0, frame))}
                    />
                  </Suspense>
                </div>

                <ClipTimeline
                  totalFrames={totalFrames}
                  startFrame={startTick}
                  endFrame={endTick}
                  currentFrame={currentTick}
                  maxDurationSeconds={maxDurationSeconds}
                  previewing={previewing}
                  disabled={saving || !hasReadyReplay}
                  onPreviewToggle={previewing ? stopPreview : previewSelection}
                  onCurrentFrameChange={(frame) => {
                    setCurrentTick(frame);
                    setSeekRequest(frame);
                  }}
                  onRangeChange={updateRange}
                />
              </section>

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
              disabled={saving || !hasReadyReplay || startTick >= endTick || endTick > totalFrames}
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
  previewing,
  disabled,
  onCurrentFrameChange,
  onRangeChange,
  onPreviewToggle,
}: {
  totalFrames: number;
  startFrame: number;
  endFrame: number;
  currentFrame: number;
  maxDurationSeconds: number;
  previewing: boolean;
  disabled: boolean;
  onCurrentFrameChange: (frame: number) => void;
  onRangeChange: (startFrame: number, endFrame: number) => void;
  onPreviewToggle: () => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"start" | "end" | null>(null);
  const safeTotal = Math.max(1, totalFrames);
  const ticks = useMemo(() => buildTimelineTicks(safeTotal), [safeTotal]);

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

  function beginDrag(side: "start" | "end", event: ReactPointerEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragRef.current = side;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const side = dragRef.current;
    if (!side || disabled) {
      return;
    }

    const frame = frameAtPointer(event);
    if (side === "start") {
      onRangeChange(Math.min(frame, endFrame - 1), endFrame);
    } else {
      onRangeChange(startFrame, Math.max(frame, startFrame + 1));
    }
  }

  function endDrag() {
    dragRef.current = null;
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
    if (side === "start") onRangeChange(nextFrame, endFrame);
    else onRangeChange(startFrame, nextFrame);
  }

  const selectionLeft = `${(startFrame / safeTotal) * 100}%`;
  const selectionWidth = `${((endFrame - startFrame) / safeTotal) * 100}%`;
  const endLeft = `${(endFrame / safeTotal) * 100}%`;
  const playheadLeft = `${(clamp(currentFrame, 0, safeTotal) / safeTotal) * 100}%`;

  return (
    <div className="border-t border-white/10 bg-muted/10 p-4 sm:p-5" aria-label="Janela de corte">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Janela de corte
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Arraste os marcadores para escolher o momento.
          </p>
        </div>
        <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold tabular-nums text-primary">
          {formatClipDuration(endFrame - startFrame)} / {maxDurationSeconds}s
        </div>
      </div>

      <div className="mt-4 px-1">
        <div className="relative h-5 text-[10px] tabular-nums text-muted-foreground">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute -translate-x-1/2"
              style={{ left: `${(tick / safeTotal) * 100}%` }}
            >
              {formatClipTicks(tick)}
            </span>
          ))}
        </div>

        <div
          ref={timelineRef}
          className="relative h-14 touch-none rounded-xl border border-white/10 bg-background/80 shadow-inner"
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={(event) => {
            if (event.buttons === 0) endDrag();
          }}
          aria-label="Seleção de intervalo"
        >
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />
          <div
            className="absolute top-1/2 h-4 -translate-y-1/2 rounded-full bg-primary/70 shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_18%,transparent)]"
            style={{ left: selectionLeft, width: selectionWidth }}
          />
          <div
            className="pointer-events-none absolute inset-y-2 w-px bg-foreground/90 shadow-[0_0_0_1px_color-mix(in_oklch,var(--background)_60%,transparent)]"
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-semibold tabular-nums text-foreground">
          {formatClipTicks(startFrame)} — {formatClipTicks(endFrame)}
        </span>
        <span>{formatClipDuration(endFrame - startFrame)} selecionados</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Playhead: {formatClipTicks(currentFrame)}
        </span>
        <Button
          type="button"
          size="sm"
          variant={previewing ? "default" : "outline"}
          onClick={onPreviewToggle}
          disabled={disabled}
        >
          {previewing ? <Pause className="size-4" /> : <Play className="size-4" />}
          {previewing ? "Parar prévia" : "Prévia da seleção"}
        </Button>
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
