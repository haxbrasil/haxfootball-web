import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";

export function RankingTable<T>({
  rows,
  columns,
  getRank,
}: {
  rows: T[];
  columns: Array<{
    key: string;
    title: string;
    cell: (row: T) => ReactNode;
  }>;
  getRank: (row: T) => string | number;
}) {
  return (
    <div className="bfl-panel overflow-hidden rounded-xl border shadow-xs">
      <Table>
        <TableHeader className="bg-muted/70">
          <TableRow className="border-border/70 hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.key} className="h-11 text-muted-foreground">
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index} className="hover:bg-muted/60">
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={column.key === "rank" ? "w-16 font-semibold text-primary" : undefined}
                >
                  {column.key === "rank" ? `#${getRank(row)}` : column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
