'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  CalendarIcon, 
  Filter, 
  X, 
  Save, 
  BookOpen, 
  Search,
  Clock,
  Sparkles,
  Settings,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { format, subDays, startOfYear, endOfDay, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { TradeSource } from '@/types/trade';
import { toast } from 'sonner';

interface EnhancedTradeFilter {
  // Basic filters (existing)
  tokenAddress?: string;
  startDate?: Date;
  endDate?: Date;
  tradeType?: 'buy' | 'sell' | 'swap';
  pnlType?: 'profit' | 'loss';
  dex?: string;
  minVolume?: number;
  maxVolume?: number;

  // Enhanced filters
  source?: TradeSource;
  tokenSymbol?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  pnlRange?: {
    min?: number;
    max?: number;
  };
  selectedDexes?: string[];
  hasMistakes?: boolean;
  mistakeTypes?: string[];
  hasJournal?: boolean;
  journalTypes?: ('notes' | 'voice' | 'files')[];
  advancedQuery?: string;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: EnhancedTradeFilter;
  description?: string;
  isDefault?: boolean;
}

interface EnhancedTradeFiltersProps {
  onFiltersChange: (filters: EnhancedTradeFilter) => void;
  availableTokens: Array<{ address: string; symbol: string; }>;
  availableDexes: string[];
  availableMistakeTypes?: string[];
  className?: string;
}

export function EnhancedTradeFilters({ 
  onFiltersChange, 
  availableTokens, 
  availableDexes,
  availableMistakeTypes = [],
  className 
}: EnhancedTradeFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<EnhancedTradeFilter>({});
  const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  const [tokenSearchOpen, setTokenSearchOpen] = useState(false);
  const [dexSearchOpen, setDexSearchOpen] = useState(false);

  // Date range presets
  const datePresets = [
    { label: '7 days', value: subDays(new Date(), 7) },
    { label: '30 days', value: subDays(new Date(), 30) },
    { label: '90 days', value: subDays(new Date(), 90) },
    { label: 'YTD', value: startOfYear(new Date()) },
  ];

  // Default presets
  const defaultPresets: FilterPreset[] = [
    {
      id: 'profitable-trades',
      name: 'Profitable Trades',
      filters: { pnlType: 'profit' },
      description: 'Show only trades with positive P&L',
      isDefault: true,
    },
    {
      id: 'losing-trades',
      name: 'Losing Trades',
      filters: { pnlType: 'loss' },
      description: 'Show only trades with negative P&L',
      isDefault: true,
    },
    {
      id: 'manual-trades',
      name: 'Manual Trades',
      filters: { source: TradeSource.MANUAL },
      description: 'Show only manually added trades',
      isDefault: true,
    },
    {
      id: 'high-value',
      name: 'High Value Trades',
      filters: { minVolume: 10000 },
      description: 'Trades over $10,000',
      isDefault: true,
    },
    {
      id: 'with-mistakes',
      name: 'Trades with Mistakes',
      filters: { hasMistakes: true },
      description: 'Trades that have mistake annotations',
      isDefault: true,
    },
  ];

  // Load presets and URL state on mount
  useEffect(() => {
    // Load saved presets
    const saved = localStorage.getItem('trade-filter-presets');
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved presets:', error);
      }
    }

    // Load filters from URL
    const urlFilters = loadFiltersFromURL();
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
      onFiltersChange(urlFilters);
    }
  }, [searchParams]);

  // Load filters from URL
  const loadFiltersFromURL = (): EnhancedTradeFilter => {
    const urlFilters: EnhancedTradeFilter = {};
    
    const source = searchParams.get('source');
    if (source && Object.values(TradeSource).includes(source as TradeSource)) {
      urlFilters.source = source as TradeSource;
    }

    const tokenSymbol = searchParams.get('token');
    if (tokenSymbol) {
      urlFilters.tokenSymbol = tokenSymbol;
      const token = availableTokens.find(t => t.symbol.toLowerCase() === tokenSymbol.toLowerCase());
      if (token) urlFilters.tokenAddress = token.address;
    }

    const tradeType = searchParams.get('type');
    if (tradeType && ['buy', 'sell', 'swap'].includes(tradeType)) {
      urlFilters.tradeType = tradeType as any;
    }

    const dex = searchParams.get('dex');
    if (dex) urlFilters.dex = dex;

    const startDate = searchParams.get('from');
    if (startDate) urlFilters.startDate = new Date(startDate);

    const endDate = searchParams.get('to');
    if (endDate) urlFilters.endDate = new Date(endDate);

    const minVolume = searchParams.get('minVolume');
    if (minVolume) urlFilters.minVolume = parseFloat(minVolume);

    const maxVolume = searchParams.get('maxVolume');
    if (maxVolume) urlFilters.maxVolume = parseFloat(maxVolume);

    return urlFilters;
  };

  // Save filters to URL
  const saveFiltersToURL = (newFilters: EnhancedTradeFilter) => {
    const params = new URLSearchParams();
    
    if (newFilters.source) params.set('source', newFilters.source);
    if (newFilters.tokenSymbol) params.set('token', newFilters.tokenSymbol);
    if (newFilters.tradeType) params.set('type', newFilters.tradeType);
    if (newFilters.dex) params.set('dex', newFilters.dex);
    if (newFilters.startDate) params.set('from', newFilters.startDate.toISOString());
    if (newFilters.endDate) params.set('to', newFilters.endDate.toISOString());
    if (newFilters.minVolume) params.set('minVolume', newFilters.minVolume.toString());
    if (newFilters.maxVolume) params.set('maxVolume', newFilters.maxVolume.toString());

    const newURL = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newURL, { scroll: false });
  };

  const updateFilter = <K extends keyof EnhancedTradeFilter>(key: K, value: EnhancedTradeFilter[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
    saveFiltersToURL(newFilters);
  };

  const clearFilter = (key: keyof EnhancedTradeFilter) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onFiltersChange(newFilters);
    saveFiltersToURL(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    onFiltersChange({});
    router.push(pathname, { scroll: false });
  };

  // Apply date preset
  const applyDatePreset = (startDate: Date) => {
    const endDate = endOfDay(new Date());
    updateFilter('startDate', startOfDay(startDate));
    updateFilter('endDate', endDate);
  };

  // Apply filter preset
  const applyPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    onFiltersChange(preset.filters);
    saveFiltersToURL(preset.filters);
    toast.success(`Applied filter preset: ${preset.name}`);
  };

  // Save current filters as preset
  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...filters },
      description: presetDescription.trim() || undefined,
    };

    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    localStorage.setItem('trade-filter-presets', JSON.stringify(updatedPresets));
    
    setPresetName('');
    setPresetDescription('');
    setShowPresetDialog(false);
    toast.success('Filter preset saved');
  };

  // Delete preset
  const deletePreset = (presetId: string) => {
    const updatedPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updatedPresets);
    localStorage.setItem('trade-filter-presets', JSON.stringify(updatedPresets));
    toast.success('Preset deleted');
  };

  // Parse advanced query
  const parseAdvancedQuery = (query: string) => {
    const terms = query.toLowerCase().split(' ');
    const newFilters: EnhancedTradeFilter = {};

    terms.forEach(term => {
      if (term.startsWith('token:')) {
        const symbol = term.split(':')[1];
        newFilters.tokenSymbol = symbol;
        const token = availableTokens.find(t => t.symbol.toLowerCase() === symbol);
        if (token) newFilters.tokenAddress = token.address;
      } else if (term.startsWith('profit:>')) {
        const amount = parseFloat(term.split(':>')[1]);
        if (!isNaN(amount)) {
          newFilters.pnlRange = { min: amount };
        }
      } else if (term.startsWith('profit:<')) {
        const amount = parseFloat(term.split(':<')[1]);
        if (!isNaN(amount)) {
          newFilters.pnlRange = { max: amount };
        }
      } else if (term.startsWith('dex:')) {
        newFilters.dex = term.split(':')[1];
      } else if (term.startsWith('type:')) {
        const type = term.split(':')[1];
        if (['buy', 'sell', 'swap'].includes(type)) {
          newFilters.tradeType = type as any;
        }
      }
    });

    return newFilters;
  };

  const applyAdvancedQuery = () => {
    if (!filters.advancedQuery) return;
    
    const queryFilters = parseAdvancedQuery(filters.advancedQuery);
    const mergedFilters = { ...filters, ...queryFilters };
    
    setFilters(mergedFilters);
    onFiltersChange(mergedFilters);
    saveFiltersToURL(mergedFilters);
    setShowAdvancedDialog(false);
    toast.success('Advanced query applied');
  };

  const hasActiveFilters = Object.keys(filters).filter(key => key !== 'advancedQuery').length > 0;
  const allPresets = [...defaultPresets, ...savedPresets];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Enhanced Filters
              <Badge variant="secondary" className="text-xs">
                {hasActiveFilters ? `${Object.keys(filters).length} active` : 'none'}
              </Badge>
            </CardTitle>
            <CardDescription>Advanced filtering with presets and search queries</CardDescription>
          </div>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowAdvancedDialog(true)}>
              <Search className="w-3 h-3 mr-1" />
              Query
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPresetDialog(true)}>
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filter Presets */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <Label className="text-sm font-medium">Quick Presets</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {allPresets.map((preset) => (
              <Button
                key={preset.id}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="h-7 text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Date Range Presets */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <Label className="text-sm font-medium">Date Presets</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {datePresets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => applyDatePreset(preset.value)}
                className="h-7 text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.source && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Source: {filters.source}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('source')} />
                </Badge>
              )}
              {filters.tokenSymbol && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Token: {filters.tokenSymbol}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('tokenSymbol')} />
                </Badge>
              )}
              {filters.startDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  From: {format(filters.startDate, 'MMM dd')}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('startDate')} />
                </Badge>
              )}
              {filters.endDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  To: {format(filters.endDate, 'MMM dd')}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('endDate')} />
                </Badge>
              )}
              {filters.tradeType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {filters.tradeType}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('tradeType')} />
                </Badge>
              )}
              {filters.dex && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  DEX: {filters.dex}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('dex')} />
                </Badge>
              )}
              {filters.hasMistakes && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Has Mistakes
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('hasMistakes')} />
                </Badge>
              )}
              {filters.hasJournal && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Has Journal
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('hasJournal')} />
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Trade Source */}
          <div className="space-y-2">
            <Label>Trade Source</Label>
            <Select
              value={filters.source || ""}
              onValueChange={(value) => updateFilter('source', value as TradeSource || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All sources</SelectItem>
                <SelectItem value={TradeSource.IMPORTED}>Imported</SelectItem>
                <SelectItem value={TradeSource.MANUAL}>Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Token Filter with Search */}
          <div className="space-y-2">
            <Label>Token</Label>
            <Popover open={tokenSearchOpen} onOpenChange={setTokenSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={tokenSearchOpen}
                  className="w-full justify-between"
                >
                  {filters.tokenSymbol
                    ? availableTokens.find(token => token.symbol === filters.tokenSymbol)?.symbol
                    : "Select token..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search tokens..." />
                  <CommandList>
                    <CommandEmpty>No token found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value=""
                        onSelect={() => {
                          updateFilter('tokenSymbol', undefined);
                          updateFilter('tokenAddress', undefined);
                          setTokenSearchOpen(false);
                        }}
                      >
                        All tokens
                      </CommandItem>
                      {availableTokens.map((token) => (
                        <CommandItem
                          key={token.address}
                          value={token.symbol}
                          onSelect={(value) => {
                            updateFilter('tokenSymbol', value);
                            updateFilter('tokenAddress', token.address);
                            setTokenSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.tokenSymbol === token.symbol ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {token.symbol}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Trade Type */}
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

          {/* DEX Multi-select */}
          <div className="space-y-2">
            <Label>DEX/Exchange</Label>
            <Popover open={dexSearchOpen} onOpenChange={setDexSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {filters.dex || "All DEXes"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search DEXes..." />
                  <CommandList>
                    <CommandEmpty>No DEX found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value=""
                        onSelect={() => {
                          updateFilter('dex', undefined);
                          setDexSearchOpen(false);
                        }}
                      >
                        All DEXes
                      </CommandItem>
                      {availableDexes.map((dex) => (
                        <CommandItem
                          key={dex}
                          value={dex}
                          onSelect={(value) => {
                            updateFilter('dex', value);
                            setDexSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.dex === dex ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {dex}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* P&L Type */}
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

          {/* Journal Filter */}
          <div className="space-y-2">
            <Label>Journal Status</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasJournal"
                  checked={filters.hasJournal || false}
                  onCheckedChange={(checked) => updateFilter('hasJournal', checked as boolean)}
                />
                <Label htmlFor="hasJournal" className="text-sm">Has journal entries</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasMistakes"
                  checked={filters.hasMistakes || false}
                  onCheckedChange={(checked) => updateFilter('hasMistakes', checked as boolean)}
                />
                <Label htmlFor="hasMistakes" className="text-sm">Has mistake annotations</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Range Filters */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Min Price ($)</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.priceRange?.min || ''}
              onChange={(e) => updateFilter('priceRange', { 
                ...filters.priceRange, 
                min: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Price ($)</Label>
            <Input
              type="number"
              placeholder="No limit"
              value={filters.priceRange?.max || ''}
              onChange={(e) => updateFilter('priceRange', { 
                ...filters.priceRange, 
                max: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
            />
          </div>
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

        {/* Date Range */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover open={showCalendar === 'start'} onOpenChange={(open) => setShowCalendar(open ? 'start' : null)}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                <Button variant="outline" className="w-full justify-start text-left font-normal">
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
        </div>

        {/* Advanced Query Dialog */}
        <Dialog open={showAdvancedDialog} onOpenChange={setShowAdvancedDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Advanced Search Query</DialogTitle>
              <DialogDescription>
                Use advanced syntax to filter trades. Examples:
                <br />
                • <code>token:SOL type:buy profit:>100</code>
                <br />
                • <code>dex:jupiter profit:&lt;-50</code>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Enter your search query..."
                value={filters.advancedQuery || ''}
                onChange={(e) => updateFilter('advancedQuery', e.target.value)}
                rows={3}
              />
              
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Available syntax:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><code>token:SYMBOL</code> - Filter by token symbol</li>
                  <li><code>type:buy|sell|swap</code> - Filter by trade type</li>
                  <li><code>dex:NAME</code> - Filter by DEX name</li>
                  <li><code>profit:>AMOUNT</code> - Minimum profit</li>
                  <li><code>profit:&lt;AMOUNT</code> - Maximum profit (or loss)</li>
                </ul>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAdvancedDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={applyAdvancedQuery}>
                  Apply Query
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Save Preset Dialog */}
        <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Filter Preset</DialogTitle>
              <DialogDescription>
                Save the current filter configuration as a preset for quick access
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Preset Name</Label>
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., My Trading Strategy"
                />
              </div>
              
              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  placeholder="Brief description of this filter combination..."
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPresetDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={savePreset}>
                  Save Preset
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default EnhancedTradeFilters;