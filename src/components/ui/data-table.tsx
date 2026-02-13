'use client';

import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  Filter,
  Download,
  Settings,
  Eye,
  EyeOff,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Badge } from './badge';

export interface Column<T> {
  id: string;
  header: string;
  accessor: (row: T) => any;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  onRowClick?: (row: T) => void;
  onExport?: () => void;
  selectedRows?: T[];
  onSelectRow?: (row: T) => void;
  onSelectAll?: (selected: boolean) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
  showColumnToggle?: boolean;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onSort,
  onFilter,
  onRowClick,
  onExport,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  loading = false,
  emptyMessage = 'No data available',
  className,
  stickyHeader = false,
  showColumnToggle = false,
  actions,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.id))
  );

  const handleSort = (columnId: string) => {
    if (!columns.find(col => col.id === columnId)?.sortable) return;

    const newDirection = 
      sortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
    
    setSortColumn(columnId);
    setSortDirection(newDirection);
    onSort?.(columnId, newDirection);
  };

  const toggleColumn = (columnId: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId);
    } else {
      newVisible.add(columnId);
    }
    setVisibleColumns(newVisible);
  };

  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ChevronsUpDown className="h-4 w-4 text-text-muted" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 text-primary" />
    );
  };

  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  if (loading) {
    return (
      <div className={cn(
        'rounded-lg border border-border-default bg-surface',
        className
      )}>
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-2 text-sm text-text-muted">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-lg border border-border-default bg-surface overflow-hidden',
      className
    )}>
      {/* Table Controls */}
      {(onExport || showColumnToggle) && (
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            {selectedRows.length > 0 && (
              <Badge variant="secondary">
                {selectedRows.length} selected
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {showColumnToggle && (
              <div className="relative group">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Columns
                </Button>
                
                {/* Column toggle dropdown */}
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-border-default bg-surface shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-dropdown">
                  <div className="p-2 space-y-1">
                    {columns.map(column => (
                      <button
                        key={column.id}
                        onClick={() => toggleColumn(column.id)}
                        className="w-full flex items-center justify-between p-2 text-sm rounded hover:bg-surface-hover transition-colors"
                      >
                        <span className="text-text-primary">
                          {column.header}
                        </span>
                        {visibleColumns.has(column.id) ? (
                          <Eye className="h-4 w-4 text-primary" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-text-muted" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={cn(
            'border-b border-border-default bg-surface-muted/50',
            stickyHeader && 'sticky top-0 z-10'
          )}>
            <tr>
              {/* Checkbox column */}
              {onSelectRow && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="rounded border-border-default text-primary focus:ring-primary"
                  />
                </th>
              )}
              
              {/* Data columns */}
              {columns
                .filter(col => visibleColumns.has(col.id))
                .map(column => (
                  <th
                    key={column.id}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider',
                      column.sortable && 'cursor-pointer hover:bg-surface-hover transition-colors',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.className
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className={cn(
                      'flex items-center gap-2',
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}>
                      <span>{column.header}</span>
                      {column.sortable && getSortIcon(column.id)}
                    </div>
                  </th>
                ))}
              
              {/* Actions column */}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-border-default">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (onSelectRow ? 1 : 0) + (actions ? 1 : 0)}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const isSelected = selectedRows.some(
                  selected => (selected.id && row.id) ? selected.id === row.id : selected === row
                );
                
                return (
                  <tr
                    key={row.id || rowIndex}
                    className={cn(
                      'hover:bg-surface-hover transition-colors',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-primary/5'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {/* Checkbox cell */}
                    {onSelectRow && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            onSelectRow(row);
                          }}
                          className="rounded border-border-default text-primary focus:ring-primary"
                        />
                      </td>
                    )}
                    
                    {/* Data cells */}
                    {columns
                      .filter(col => visibleColumns.has(col.id))
                      .map(column => {
                        const value = column.accessor(row);
                        const content = column.render ? column.render(value, row) : value;
                        
                        return (
                          <td
                            key={column.id}
                            className={cn(
                              'px-4 py-3 text-sm text-text-primary',
                              column.align === 'center' && 'text-center',
                              column.align === 'right' && 'text-right',
                              column.className
                            )}
                          >
                            {content}
                          </td>
                        );
                      })}
                    
                    {/* Actions cell */}
                    {actions && (
                      <td className="px-4 py-3 text-right">
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1"
                        >
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}