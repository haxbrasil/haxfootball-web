import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { cn } from "#/lib/utils";
import { PubRankingDialogFilters } from "./pub-ranking-dialog-filters";
import type { PubRankingFilters } from "../utils/pub-ranking-filters";

export function PubRankingDialogShell({
  categoryKey,
  children,
  description,
  filters,
  hasItems,
  isLoading,
  maxWidthClassName = "sm:max-w-6xl",
  onFilterChange,
  onOpenChange,
  onSearchChange,
  open,
  search,
  title,
  trigger,
}: {
  categoryKey: string;
  children: ReactNode;
  description: string;
  filters: PubRankingFilters;
  hasItems: boolean;
  isLoading: boolean;
  maxWidthClassName?: string;
  onFilterChange: <TField extends keyof PubRankingFilters>(
    field: TField,
    value: PubRankingFilters[TField],
  ) => void;
  onOpenChange: (open: boolean) => void;
  onSearchChange: (search: string) => void;
  open: boolean;
  search: string;
  title: string;
  trigger: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "grid max-h-[90vh] grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden",
          maxWidthClassName,
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <PubRankingDialogFilters
          categoryKey={categoryKey}
          filters={filters}
          search={search}
          onFilterChange={onFilterChange}
          onSearchChange={onSearchChange}
        />

        <div className="bfl-scrollbar min-h-0 overflow-auto pr-1">
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Carregando ranking...
            </div>
          ) : hasItems ? (
            children
          ) : (
            <p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
              Nenhuma entrada encontrada.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
