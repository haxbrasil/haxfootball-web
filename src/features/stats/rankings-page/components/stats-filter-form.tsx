import { BarChart3 } from "lucide-react";
import { NativeSelectField } from "#/components/ds/forms/native-select-field";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import type { StatsMetric } from "#/lib/stats-metrics/formatting";
import type { StatsFormState } from "../hooks/use-stats-query-form";

export function StatsFilterForm({
  formState,
  metricColumns,
  isLoading,
  onSubmit,
  onChange,
}: {
  formState: StatsFormState;
  metricColumns: StatsMetric[];
  isLoading: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: <TField extends keyof StatsFormState>(
    field: TField,
    value: StatsFormState[TField],
  ) => void;
}) {
  return (
    <Card className="mb-5">
      <CardContent>
        <form className="grid gap-4 md:grid-cols-3 xl:grid-cols-6" onSubmit={onSubmit}>
          <NativeSelectField
            id="groupBy"
            label="Agrupar por"
            value={formState.groupBy}
            onChange={(groupBy) => onChange("groupBy", groupBy)}
            options={[
              { value: "player", label: "Jogador" },
              { value: "account", label: "Conta" },
              { value: "account-or-player", label: "Conta ou jogador" },
            ]}
          />

          <NativeSelectField
            id="sortKey"
            label="Ordenar por"
            value={formState.sortKey}
            onChange={(sortKey) => onChange("sortKey", sortKey)}
            options={[
              { value: "name", label: "Nome" },
              ...metricColumns.map((metric) => ({ value: metric.key, label: metric.label })),
            ]}
          />

          <NativeSelectField
            id="direction"
            label="Direção"
            value={formState.direction}
            onChange={(direction) => onChange("direction", direction)}
            options={[
              { value: "asc", label: "Crescente" },
              { value: "desc", label: "Decrescente" },
            ]}
          />

          <NativeSelectField
            id="status"
            label="Status"
            value={formState.status}
            onChange={(status) => onChange("status", status)}
            options={[
              { value: "all", label: "Todos" },
              { value: "completed", label: "Finalizadas" },
              { value: "ongoing", label: "Em andamento" },
            ]}
          />

          <NativeSelectField
            id="limit"
            label="Limite"
            value={String(formState.limit)}
            onChange={(limit) => onChange("limit", Number(limit))}
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
          />

          <div className="flex items-end">
            <Button className="w-full" disabled={isLoading} type="submit">
              <BarChart3 className="size-4" />
              {isLoading ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
