'use client';
import type { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
export function DataTable({
  headers,
  rows,
  empty = 'No matching records.',
}: {
  headers: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  return (
    <div className="table-scroll">
      <Table className="data-table">
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((r, i) => (
              <TableRow key={i}>
                {r.map((v, j) => (
                  <TableCell key={j}>{v}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length}>{empty}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return <div className="notice">{children}</div>;
}
