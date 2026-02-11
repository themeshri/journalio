'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Position } from '@/types/position';

interface PositionsTableProps {
  positions: Position[];
  isLoading?: boolean;
}

type SortField = 'openDate' | 'closeDate' | 'symbol' | 'pnl' | 'duration' | 'size' | 'status';
type SortDirection = 'asc' | 'desc';

export function PositionsTable({ positions, isLoading }: PositionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('openDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());
  const itemsPerPage = 25;

  const calculateDuration = (position: Position): number => {
    if (!position.closeDate) {
      // For open positions, calculate duration from open to now
      return (Date.now() - position.openDate.getTime()) / (1000 * 60 * 60);
    }
    return (position.closeDate.getTime() - position.openDate.getTime()) / (1000 * 60 * 60);
  };

  const getPositionSize = (position: Position): number => {
    return position.totalQuantity * position.avgEntryPrice;
  };

  const getTotalPnL = (position: Position): number => {
    return position.realizedPnL + position.unrealizedPnL;
  };

  const filteredPositions = useMemo(() => {
    let filtered = [...positions];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pos => pos.status === statusFilter);
    }
    
    if (symbolFilter) {
      filtered = filtered.filter(pos => 
        pos.symbol.toLowerCase().includes(symbolFilter.toLowerCase())
      );
    }
    
    return filtered;
  }, [positions, statusFilter, symbolFilter]);

  const sortedAndFilteredPositions = useMemo(() => {
    let sorted = [...filteredPositions];
    
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'openDate':
          aValue = a.openDate.getTime();
          bValue = b.openDate.getTime();
          break;
        case 'closeDate':
          aValue = a.closeDate?.getTime() || 0;
          bValue = b.closeDate?.getTime() || 0;
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'pnl':
          aValue = getTotalPnL(a);
          bValue = getTotalPnL(b);
          break;
        case 'duration':
          aValue = calculateDuration(a);
          bValue = calculateDuration(b);
          break;
        case 'size':
          aValue = getPositionSize(a);
          bValue = getPositionSize(b);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [filteredPositions, sortField, sortDirection]);

  const paginatedPositions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredPositions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredPositions, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredPositions.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const toggleExpandPosition = (positionId: string) => {
    const newExpanded = new Set(expandedPositions);
    if (newExpanded.has(positionId)) {
      newExpanded.delete(positionId);
    } else {
      newExpanded.add(positionId);
    }
    setExpandedPositions(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const formatQuantity = (quantity: number, decimals = 4) => {
    return quantity.toFixed(decimals);
  };

  const getUniqueSymbols = () => {
    return [...new Set(positions.map(p => p.symbol))].sort();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
          <CardDescription>Loading position data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Positions</CardTitle>
        <CardDescription>
          {sortedAndFilteredPositions.length} position{sortedAndFilteredPositions.length !== 1 ? 's' : ''} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Status:</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Symbol:</label>
            <select 
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Symbols</option>
              {getUniqueSymbols().map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('symbol')}
                    className="h-8 px-2 lg:px-3 font-medium"
                  >
                    Token
                    {getSortIcon('symbol')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('status')}
                    className="h-8 px-2 lg:px-3 font-medium"
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('size')}
                    className="h-8 px-2 lg:px-3 font-medium"
                  >
                    Size
                    {getSortIcon('size')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('openDate')}
                    className="h-8 px-2 lg:px-3 font-medium"
                  >
                    Entry Date
                    {getSortIcon('openDate')}
                  </Button>
                </TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Exit Price</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('duration')}
                    className="h-8 px-2 lg:px-3 font-medium"
                  >
                    Duration
                    {getSortIcon('duration')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('pnl')}
                    className="h-8 px-2 lg:px-3 font-medium"
                  >
                    P&L
                    {getSortIcon('pnl')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPositions.map((position) => (
                <TableRow key={position.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpandPosition(position.id)}
                      className="p-0 h-6 w-6"
                    >
                      {expandedPositions.has(position.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {position.symbol}
                  </TableCell>
                  <TableCell>
                    <Badge variant={position.status === 'open' ? 'default' : 'secondary'}>
                      {position.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatQuantity(position.totalQuantity)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(getPositionSize(position))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(position.openDate, 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(position.avgEntryPrice)}
                  </TableCell>
                  <TableCell>
                    {position.avgExitPrice ? formatCurrency(position.avgExitPrice) : '-'}
                  </TableCell>
                  <TableCell>
                    {formatDuration(calculateDuration(position))}
                  </TableCell>
                  <TableCell>
                    <div className={`font-medium ${
                      getTotalPnL(position) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(getTotalPnL(position))}
                    </div>
                    {position.status === 'open' && position.unrealizedPnL !== 0 && (
                      <div className="text-xs text-muted-foreground">
                        Unrealized
                      </div>
                    )}
                    {position.status === 'closed' && position.realizedPnL !== 0 && (
                      <div className="text-xs text-muted-foreground">
                        Realized
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                    >
                      View Trades
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, sortedAndFilteredPositions.length)} of{' '}
              {sortedAndFilteredPositions.length} positions
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {paginatedPositions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No positions found matching your filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}