"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "~/components/ui/table"
import type { Course } from "@lehuyh/assist-js/types";
import { ColumnDef,flexRender,getCoreRowModel,useReactTable } from "@tanstack/react-table"
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { EyeIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CardTitle } from "../ui/card";

export const columns: ColumnDef<Course & {
    shortName:string,
    hardRequire:boolean
    requiredBy:string[]
}>[] = [
    {
        accessorKey: "shortName",
        header: "Code"
    },
    {
      accessorKey: "courseTitle",
      header: "Name"
    },
    {
        header:"Required By",
        accessorKey: "requiredBy",
        cell: (info)=>{
            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button size="sm" variant="secondary" Icon={EyeIcon}/> 
                    </PopoverTrigger>
                    <PopoverContent>
                        <CardTitle className="text-base">Required By</CardTitle>
                        <ul className="list list-disc list-inside text-sm">
                            {
                                (info.row.getValue('requiredBy') as string[]).map(s=>{
                                    return <li key={s}>{s}</li>
                                })
                            }
                        </ul>

                    </PopoverContent>
                </Popover>
            )
        }
    },
    {
        accessorKey: "hardRequire",
        header: "Hard Requirement?",
        cell: (info)=>{
            return (
                <Badge variant={info.row.getValue('hardRequire') ? 'destructive' : 'secondary'}>
                    {info.row.getValue('hardRequire') ? 'Hard Requirement' : 'User Selected'}
                </Badge>
            )
        }
    },
]

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border max-w-[90vw]">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function PlanClassTable({ hardRequirements, userSelected }: { 
    hardRequirements: (Course&{requiredBy:string[]})[],
    userSelected: (Course&{requiredBy:string[]})[]
}) {

    const data = hardRequirements.map(c=>({
        ...c,
        shortName: `${c.prefix}${c.courseNumber}`,
        hardRequire: true
    })).concat(userSelected.map(c=>({
        ...c,
        shortName: `${c.prefix}${c.courseNumber}`,
        hardRequire: false
    })))

    return (
        <DataTable columns={columns} data={data}/>
    )

}