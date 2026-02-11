'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { TradeFilter } from '@/types/analytics';

interface TradeFiltersProps {
  onFiltersChange: (filters: TradeFilter) => void;
  availableTokens: Array<{ address: string; symbol: string; }>;
  availableDexes: string[];
}

export function TradeFilters({ onFiltersChange, availableTokens, availableDexes }: TradeFiltersProps) {
  const [filters, setFilters] = useState<TradeFilter>({});
  const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null);

  const updateFilter = <K extends keyof TradeFilter>(key: K, value: TradeFilter[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilter = (key: keyof TradeFilter) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter trades by various criteria</CardDescription>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.tokenAddress && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Token: {availableTokens.find(t => t.address === filters.tokenAddress)?.symbol || 'Unknown'}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter('tokenAddress')}
                />
              </Badge>
            )}
            {filters.startDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                From: {format(filters.startDate, 'MMM dd, yyyy')}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter('startDate')}
                />
              </Badge>
            )}
            {filters.endDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                To: {format(filters.endDate, 'MMM dd, yyyy')}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter('endDate')}
                />
              </Badge>
            )}
            {filters.tradeType && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Type: {filters.tradeType}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter('tradeType')}
                />
              </Badge>
            )}
            {filters.pnlType && (
              <Badge variant="secondary" className="flex items-center gap-1">
                P&L: {filters.pnlType}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter('pnlType')}
                />
              </Badge>
            )}
            {filters.dex && (
              <Badge variant="secondary" className="flex items-center gap-1">
                DEX: {filters.dex}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter('dex')}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Filter Controls */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Token Filter */}
          <div className="space-y-2">
            <Label>Token</Label>
            <Select
              value={filters.tokenAddress || ""}
              onValueChange={(value) => updateFilter('tokenAddress', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All tokens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All tokens</SelectItem>
                {availableTokens.map((token) => (
                  <SelectItem key={token.address} value={token.address}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover open={showCalendar === 'start'} onOpenChange={(open) => setShowCalendar(open ? 'start' : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => {
                    updateFilter('startDate', date);
                    setShowCalendar(null);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover open={showCalendar === 'end'} onOpenChange={(open) => setShowCalendar(open ? 'end' : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => {
                    updateFilter('endDate', date);
                    setShowCalendar(null);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Trade Type Filter */}
          <div className="space-y-2">
            <Label>Trade Type</Label>
            <Select
              value={filters.tradeType || ""}
              onValueChange={(value) => updateFilter('tradeType', value as any || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="swap">Swap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* P&L Filter */}
          <div className="space-y-2">
            <Label>P&L Type</Label>
            <Select
              value={filters.pnlType || ""}
              onValueChange={(value) => updateFilter('pnlType', value as any || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All trades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All trades</SelectItem>
                <SelectItem value="profit">Profitable only</SelectItem>
                <SelectItem value="loss">Losses only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DEX Filter */}
          <div className="space-y-2">
            <Label>DEX</Label>
            <Select
              value={filters.dex || ""}
              onValueChange={(value) => updateFilter('dex', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All DEXes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All DEXes</SelectItem>
                {availableDexes.map((dex) => (
                  <SelectItem key={dex} value={dex}>
                    {dex.charAt(0).toUpperCase() + dex.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Volume Range */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Min Volume ($)</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minVolume || ''}
              onChange={(e) => updateFilter('minVolume', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Volume ($)</Label>
            <Input
              type="number"
              placeholder="No limit"
              value={filters.maxVolume || ''}
              onChange={(e) => updateFilter('maxVolume', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}