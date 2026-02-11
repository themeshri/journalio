'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Trade {
  id: string;
  signature: string;
  type: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceIn?: string;
  priceOut?: string;
  dex?: string;
  fees: string;
  blockTime: Date;
  processed: boolean;
  error?: string;
}

interface TradesTableProps {
  trades: Trade[];
  isLoading?: boolean;
}

type SortField = 'blockTime' | 'pnl' | 'volume' | 'type' | 'dex';
type SortDirection = 'asc' | 'desc';

export function TradesTable({ trades, isLoading }: TradesTableProps) {
  const [sortField, setSortField] = useState<SortField>('blockTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const calculatePnL = (trade: Trade): number => {
    if (!trade.priceIn || !trade.priceOut) return 0;
    
    const amountIn = parseFloat(trade.amountIn);
    const amountOut = parseFloat(trade.amountOut);
    const priceIn = parseFloat(trade.priceIn);
    const priceOut = parseFloat(trade.priceOut);
    const fees = parseFloat(trade.fees || '0');

    if (trade.type === 'buy') {
      const cost = amountIn * priceIn + fees;
      const currentValue = amountOut * priceOut;
      return currentValue - cost;
    } else if (trade.type === 'sell') {
      const received = amountOut * priceOut - fees;
      const costBasis = amountIn * priceIn;
      return received - costBasis;
    }
    
    const valueIn = amountIn * priceIn;
    const valueOut = amountOut * priceOut;
    return valueOut - valueIn - fees;
  };

  const calculateVolume = (trade: Trade): number => {
    if (!trade.priceIn) return 0;
    return parseFloat(trade.amountIn) * parseFloat(trade.priceIn);
  };

  const sortedAndFilteredTrades = useMemo(() => {
    let sorted = [...trades];
    
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'blockTime':
          aValue = new Date(a.blockTime).getTime();
          bValue = new Date(b.blockTime).getTime();
          break;
        case 'pnl':
          aValue = calculatePnL(a);
          bValue = calculatePnL(b);
          break;
        case 'volume':
          aValue = calculateVolume(a);
          bValue = calculateVolume(b);
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'dex':
          aValue = a.dex || '';
          bValue = b.dex || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [trades, sortField, sortDirection]);

  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredTrades.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredTrades, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredTrades.length / itemsPerPage);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatTokenAmount = (amount: string, decimals = 6) => {
    const num = parseFloat(amount);
    return num.toFixed(decimals);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trades</CardTitle>
          <CardDescription>Loading trades...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trades ({sortedAndFilteredTrades.length})</CardTitle>
        <CardDescription>Detailed trade history with P&L calculations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('blockTime')}
                >
                  Date
                  {getSortIcon('blockTime')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  Type
                  {getSortIcon('type')}
                </TableHead>
                <TableHead>Token In</TableHead>
                <TableHead>Token Out</TableHead>
                <TableHead 
                  className="cursor-pointer text-right"
                  onClick={() => handleSort('volume')}
                >
                  Volume
                  {getSortIcon('volume')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer text-right"
                  onClick={() => handleSort('pnl')}
                >
                  P&L
                  {getSortIcon('pnl')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('dex')}
                >
                  DEX
                  {getSortIcon('dex')}
                </TableHead>
                <TableHead>Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrades.map((trade) => {
                const pnl = calculatePnL(trade);
                const volume = calculateVolume(trade);
                
                return (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">
                      {format(new Date(trade.blockTime), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          trade.type === 'buy' ? 'default' : 
                          trade.type === 'sell' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {trade.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="font-medium">
                          {trade.tokenIn.slice(0, 8)}...
                        </div>
                        <div className="text-muted-foreground">
                          {formatTokenAmount(trade.amountIn)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="font-medium">
                          {trade.tokenOut.slice(0, 8)}...
                        </div>
                        <div className="text-muted-foreground">
                          {formatTokenAmount(trade.amountOut)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {volume > 0 ? formatCurrency(volume) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={
                        pnl > 0 ? 'text-green-600' : 
                        pnl < 0 ? 'text-red-600' : 
                        'text-muted-foreground'
                      }>
                        {pnl !== 0 ? formatCurrency(pnl) : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {trade.dex || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`https://solscan.io/tx/${trade.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedAndFilteredTrades.length)} of {sortedAndFilteredTrades.length} trades
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}