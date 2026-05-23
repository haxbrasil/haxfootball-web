import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";

export function ResourceTable<T>({
  rows,
  columns,
}: {
  rows: T[];
  columns: Array<{
    key: string;
    title: string;
    cell: (row: T) => ReactNode;
  }>;
}) {
  return (
    <div className="bfl-panel overflow-hidden rounded-xl border shadow-xs">
      <Table>
        <TableHeader className="bg-muted/70">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className="text-xs uppercase tracking-[0.12em]">
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column.key}>{column.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
