import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import type { WebMatch } from "#/server/api/haxfootball";
import { matchRecordingOptions, type MatchRecordingOption } from "../utils/match-recordings";
import { ClipCreatorDialog } from "./clip-editor-dialog";

const ReplayPlayer = lazy(() => import("./replay-player"));

export function MatchReplayPanel({ match }: { match: WebMatch }) {
  const options = useMemo(() => matchRecordingOptions(match), [match]);
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? "");

  useEffect(() => {
    setSelectedId(options[0]?.id ?? "");
  }, [options]);

  if (options.length === 0) {
    return null;
  }

  const selected = options.find((option) => option.id === selectedId) ?? options[0]!;

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Replay da partida</CardTitle>
        <ReplayActions options={options} selected={selected} onSelect={setSelectedId} />
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <div className="flex aspect-video items-center justify-center rounded-xl border bg-muted/30 text-sm text-muted-foreground">
              Carregando replayer…
            </div>
          }
        >
          <ReplayPlayer key={selected.id} source={selected.url} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

function ReplayActions({
  options,
  selected,
  onSelect,
}: {
  options: MatchRecordingOption[];
  selected: MatchRecordingOption;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.length > 1 ? (
        <NativeSelect
          aria-label="Tempo da gravação"
          value={selected.id}
          onChange={(event) => onSelect(event.target.value)}
        >
          {options.map((option) => (
            <NativeSelectOption key={option.id} value={option.id}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : null}
      <ClipCreatorDialog recording={selected} />
      <Button asChild size="sm" variant="outline">
        <a href={selected.url} download>
          <Download className="size-4" />
          Baixar .{selected.format ?? "hbr2"}
        </a>
      </Button>
    </div>
  );
}
