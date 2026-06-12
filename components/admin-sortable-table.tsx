"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type AdminTableCell = {
  label: string;
  sortValue: string | number;
  href?: string;
  badge?: {
    tone: "green" | "red";
    label: string;
  };
};

export type AdminTableRow = {
  id: string;
  cells: AdminTableCell[];
};

export function AdminSortableTable({ headers, rows }: { headers: string[]; rows: AdminTableRow[] }) {
  const [sort, setSort] = useState<{ column: number; direction: "asc" | "desc" }>({ column: 0, direction: "asc" });

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const first = a.cells[sort.column]?.sortValue ?? "";
      const second = b.cells[sort.column]?.sortValue ?? "";
      const result =
        typeof first === "number" && typeof second === "number"
          ? first - second
          : String(first).localeCompare(String(second), "pt-BR", { numeric: true, sensitivity: "base" });

      return sort.direction === "asc" ? result : -result;
    });
  }, [rows, sort]);

  function toggleSort(column: number) {
    setSort((current) => ({
      column,
      direction: current.column === column && current.direction === "asc" ? "desc" : "asc"
    }));
  }

  return (
    <div className="overflow-hidden rounded-md border border-ink/10 bg-white text-ink shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-[#fbfbfb]">
            <tr>
              {headers.map((header, index) => (
                <th key={header} className="px-4 py-3 text-xs font-black uppercase tracking-wide text-ink/45">
                  <button className="inline-flex items-center gap-1 transition hover:text-rosewood" type="button" onClick={() => toggleSort(index)}>
                    {header}
                    <span className="text-[10px]">{sort.column === index ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length ? sortedRows.map((row) => (
              <tr key={row.id} className="border-t border-ink/10">
                {row.cells.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 text-sm font-semibold text-ink/76">
                    <CellValue cell={cell} />
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-8 text-center font-bold text-ink/55" colSpan={headers.length}>Nenhum registro encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CellValue({ cell }: { cell: AdminTableCell }) {
  if (cell.badge) {
    const green = cell.badge.tone === "green";
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase ${green ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${green ? "bg-emerald-500" : "bg-red-500"}`} />
        {cell.badge.label}
      </span>
    );
  }

  if (cell.href) {
    return <Link className="break-all font-black text-rosewood" href={cell.href} target="_blank">{cell.label}</Link>;
  }

  return cell.label;
}
