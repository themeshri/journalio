'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Tag, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { JournalEntry } from './journal-entry';
import { cn } from '@/lib/utils';
import type { 
  JournalEntryWithFiles, 
  JournalEntryFormData, 
  SearchFilters 
} from '@/types/journal';

interface TradeJournalProps {
  tradeId?: string;
  positionId?: string;
  type?: 'trade' | 'position' | 'general';
  className?: string;
  onEntryCreate?: (data: JournalEntryFormData) => Promise<void>;
  onEntryUpdate?: (id: string, data: JournalEntryFormData) => Promise<void>;
  onEntryDelete?: (id: string) => Promise<void>;
  disabled?: boolean;
}

// Mock data for development
const MOCK_ENTRIES: JournalEntryWithFiles[] = [
  {
    id: '1',
    type: 'trade',
    targetId: 'trade-123',
    userId: 'user-1',
    title: 'Entry Strategy Analysis',
    content: 'Identified a strong support level at $45.20 with high volume confirmation. RSI showing oversold conditions. Perfect setup for a swing trade entry.',
    tags: ['support', 'oversold', 'swing-trade'],
    rating: 4,
    createdAt: new Date('2024-02-10T10:30:00Z'),
    updatedAt: new Date('2024-02-10T10:30:00Z'),
    files: [],
    voiceNotes: []
  },
  {
    id: '2', 
    type: 'trade',
    targetId: 'trade-123',
    userId: 'user-1',
    title: 'Exit Trade Review',
    content: 'Exited position at $47.80 for a 5.8% gain. Could have held longer but risk/reward was achieved. Market showed some weakness in the afternoon session.',
    tags: ['exit', 'profit', 'risk-management'],
    rating: 5,
    createdAt: new Date('2024-02-10T15:45:00Z'),
    updatedAt: new Date('2024-02-10T15:45:00Z'),
    files: [],
    voiceNotes: []
  }
];

const ENTRY_TYPE_OPTIONS = [
  { value: 'pre-trade', label: 'Pre-trade Analysis' },
  { value: 'during-trade', label: 'During Trade Notes' },
  { value: 'post-trade', label: 'Post-trade Review' },
  { value: 'general', label: 'General Notes' }
];

export function TradeJournal({
  tradeId,
  positionId,
  type = 'general',
  className,
  onEntryCreate,
  onEntryUpdate,
  onEntryDelete,
  disabled = false
}: TradeJournalProps) {
  const [entries, setEntries] = useState<JournalEntryWithFiles[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntryWithFiles[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    search: '',
    tags: [],
    rating: undefined,
    type: type
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [tradeId, positionId, type]);

  // Filter entries when search filters change
  useEffect(() => {
    filterEntries();
  }, [entries, searchFilters]);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from API
      const targetId = tradeId || positionId;
      const mockData = targetId 
        ? MOCK_ENTRIES.filter(e => e.targetId === targetId || e.type === type)
        : MOCK_ENTRIES;
      
      setEntries(mockData);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    // Text search
    if (searchFilters.search) {
      const searchTerm = searchFilters.search.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.content.toLowerCase().includes(searchTerm) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Tag filter
    if (searchFilters.tags && searchFilters.tags.length > 0) {
      filtered = filtered.filter(entry =>
        searchFilters.tags!.some(tag => entry.tags.includes(tag))
      );
    }

    // Rating filter
    if (searchFilters.rating) {
      filtered = filtered.filter(entry => entry.rating === searchFilters.rating);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredEntries(filtered);
  };

  const handleCreateEntry = async (data: JournalEntryFormData) => {
    try {
      // Set the target ID and type based on props
      const entryData = {
        ...data,
        type,
        targetId: tradeId || positionId
      };

      if (onEntryCreate) {
        await onEntryCreate(entryData);
      }

      // Refresh entries
      await loadEntries();
      setShowNewEntry(false);
    } catch (error) {
      console.error('Failed to create journal entry:', error);
    }
  };

  const handleUpdateEntry = async (entryId: string, data: JournalEntryFormData) => {
    try {
      if (onEntryUpdate) {
        await onEntryUpdate(entryId, data);
      }

      // Refresh entries
      await loadEntries();
      setEditingEntryId(null);
    } catch (error) {
      console.error('Failed to update journal entry:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      if (onEntryDelete) {
        await onEntryDelete(entryId);
      }

      // Remove from local state
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
    }
  };

  // Get all unique tags from entries
  const getAllTags = () => {
    const allTags = entries.flatMap(entry => entry.tags);
    return Array.from(new Set(allTags)).sort();
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    setSearchFilters(prev => ({ ...prev, tags: newTags }));
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Journal Entries</h2>
          <p className="text-sm text-muted-foreground">
            {tradeId ? 'Trade journal entries' : 
             positionId ? 'Position journal entries' : 
             'General journal entries'}
          </p>
        </div>
        
        <Button
          onClick={() => setShowNewEntry(true)}
          disabled={disabled || showNewEntry}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Entry
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search journal entries..."
              value={searchFilters.search}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-4">
            {/* Rating Filter */}
            <Select
              value={searchFilters.rating?.toString() || ''}
              onValueChange={(value) => 
                setSearchFilters(prev => ({ 
                  ...prev, 
                  rating: value ? parseInt(value) : undefined 
                }))
              }
            >
              <SelectTrigger className="w-40">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4" />
                  <SelectValue placeholder="Any rating" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any rating</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(searchFilters.search || searchFilters.rating || selectedTags.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchFilters({ search: '', tags: [], rating: undefined, type });
                  setSelectedTags([]);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Tag Cloud */}
          {getAllTags().length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-1 text-sm font-medium">
                <Tag className="h-4 w-4" />
                <span>Filter by tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {getAllTags().map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Entry Form */}
      {showNewEntry && (
        <JournalEntry
          isEditing={true}
          onSave={handleCreateEntry}
          onCancel={() => setShowNewEntry(false)}
          disabled={disabled}
        />
      )}

      {/* Entry List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading journal entries...
            </CardContent>
          </Card>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {entries.length === 0 ? (
                <>
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No journal entries yet</p>
                  <p className="text-sm">Create your first entry to start documenting your trading journey.</p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No entries match your filters</p>
                  <p className="text-sm">Try adjusting your search criteria.</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map(entry => (
            <JournalEntry
              key={entry.id}
              entry={entry}
              isEditing={editingEntryId === entry.id}
              onEdit={() => setEditingEntryId(entry.id)}
              onSave={(data) => handleUpdateEntry(entry.id, data)}
              onDelete={() => handleDeleteEntry(entry.id)}
              onCancel={() => setEditingEntryId(null)}
              disabled={disabled}
            />
          ))
        )}
      </div>

      {/* Entry Statistics */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Journal Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{entries.length}</div>
                <div className="text-sm text-muted-foreground">Total Entries</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {entries.filter(e => e.rating && e.rating >= 4).length}
                </div>
                <div className="text-sm text-muted-foreground">High Rated</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(entries.reduce((sum, e) => sum + (e.rating || 0), 0) / entries.length * 10) / 10}
                </div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Array.from(new Set(entries.flatMap(e => e.tags))).length}
                </div>
                <div className="text-sm text-muted-foreground">Unique Tags</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}