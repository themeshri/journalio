'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Search, AlertTriangle, Brain, Timer, Target, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PREDEFINED_MISTAKES, MISTAKE_CATEGORIES, MistakeCategoryEnum, MistakeSeverity, EmotionalState, TradeMistake } from '@/types/mistake';

interface MistakeSelectorProps {
  tradeId: string;
  onMistakesChange?: (mistakes: TradeMistake[]) => void;
  initialMistakes?: TradeMistake[];
  className?: string;
}

interface SelectedMistake {
  mistakeType: string;
  customLabel?: string;
  severity: MistakeSeverity;
  emotionalState?: EmotionalState;
  notes?: string;
  learningPoints?: string;
  preventionStrategy?: string;
}

const CATEGORY_ICONS = {
  [MistakeCategoryEnum.EMOTIONAL]: Brain,
  [MistakeCategoryEnum.RISK_MANAGEMENT]: AlertTriangle,
  [MistakeCategoryEnum.STRATEGY]: Target,
  [MistakeCategoryEnum.TIMING]: Timer,
  [MistakeCategoryEnum.TECHNICAL]: Settings,
  [MistakeCategoryEnum.CUSTOM]: Plus
};

const EMOTIONAL_STATES = [
  { value: 'CONFIDENT', label: 'Confident', color: 'bg-green-500' },
  { value: 'FEARFUL', label: 'Fearful', color: 'bg-red-500' },
  { value: 'GREEDY', label: 'Greedy', color: 'bg-orange-500' },
  { value: 'NEUTRAL', label: 'Neutral', color: 'bg-gray-500' },
  { value: 'ANXIOUS', label: 'Anxious', color: 'bg-yellow-500' },
  { value: 'EUPHORIC', label: 'Euphoric', color: 'bg-purple-500' }
];

export function MistakeSelector({ 
  tradeId, 
  onMistakesChange, 
  initialMistakes = [],
  className 
}: MistakeSelectorProps) {
  const [selectedMistakes, setSelectedMistakes] = useState<SelectedMistake[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MistakeCategoryEnum | 'all'>('all');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customMistakes, setCustomMistakes] = useState<Array<{ id: string; label: string; category: string }>>([]);
  const [mistakeFrequency, setMistakeFrequency] = useState<Record<string, number>>({});

  // Custom mistake form state
  const [customMistake, setCustomMistake] = useState({
    label: '',
    severity: 'MEDIUM' as MistakeSeverity,
    emotionalState: undefined as EmotionalState | undefined,
    notes: '',
    learningPoints: '',
    preventionStrategy: ''
  });

  useEffect(() => {
    loadCustomMistakes();
    loadMistakeFrequency();
    
    // Initialize with existing mistakes
    if (initialMistakes.length > 0) {
      const mistakes = initialMistakes.map(mistake => ({
        mistakeType: mistake.mistakeType,
        customLabel: mistake.customLabel,
        severity: mistake.severity,
        emotionalState: mistake.emotionalState,
        notes: mistake.notes,
        learningPoints: mistake.learningPoints,
        preventionStrategy: mistake.preventionStrategy
      }));
      setSelectedMistakes(mistakes);
    }
  }, [initialMistakes]);

  useEffect(() => {
    onMistakesChange?.(selectedMistakes as TradeMistake[]);
  }, [selectedMistakes, onMistakesChange]);

  const loadCustomMistakes = async () => {
    try {
      const response = await fetch('/api/mistakes/custom');
      if (response.ok) {
        const data = await response.json();
        setCustomMistakes(data.mistakes || []);
      }
    } catch (error) {
      console.error('Failed to load custom mistakes:', error);
    }
  };

  const loadMistakeFrequency = async () => {
    try {
      const response = await fetch('/api/analytics/mistakes/frequency');
      if (response.ok) {
        const data = await response.json();
        setMistakeFrequency(data.frequency || {});
      }
    } catch (error) {
      console.error('Failed to load mistake frequency:', error);
    }
  };

  const handleMistakeToggle = (mistakeId: string, isCustom = false) => {
    const existingIndex = selectedMistakes.findIndex(m => m.mistakeType === mistakeId);
    
    if (existingIndex >= 0) {
      // Remove mistake
      setSelectedMistakes(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // Add mistake
      const mistake: SelectedMistake = {
        mistakeType: mistakeId,
        severity: 'MEDIUM',
        emotionalState: undefined,
        notes: '',
        learningPoints: '',
        preventionStrategy: ''
      };

      if (isCustom) {
        const custom = customMistakes.find(m => m.id === mistakeId);
        mistake.customLabel = custom?.label;
      }

      setSelectedMistakes(prev => [...prev, mistake]);
    }
  };

  const handleMistakeUpdate = (index: number, updates: Partial<SelectedMistake>) => {
    setSelectedMistakes(prev => prev.map((mistake, i) => 
      i === index ? { ...mistake, ...updates } : mistake
    ));
  };

  const handleCustomMistakeAdd = async () => {
    if (!customMistake.label.trim()) {
      toast.error('Mistake label is required');
      return;
    }

    try {
      const response = await fetch('/api/mistakes/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customMistake.label,
          description: customMistake.notes,
          severity: customMistake.severity,
          color: '#6b7280'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add to selected mistakes
        const newMistake: SelectedMistake = {
          mistakeType: data.mistake.id,
          customLabel: customMistake.label,
          severity: customMistake.severity,
          emotionalState: customMistake.emotionalState,
          notes: customMistake.notes,
          learningPoints: customMistake.learningPoints,
          preventionStrategy: customMistake.preventionStrategy
        };

        setSelectedMistakes(prev => [...prev, newMistake]);
        
        // Reset form
        setCustomMistake({
          label: '',
          severity: 'MEDIUM',
          emotionalState: undefined,
          notes: '',
          learningPoints: '',
          preventionStrategy: ''
        });
        setShowCustomForm(false);
        
        // Reload custom mistakes
        await loadCustomMistakes();
        
        toast.success('Custom mistake added');
      } else {
        toast.error('Failed to add custom mistake');
      }
    } catch (error) {
      console.error('Error adding custom mistake:', error);
      toast.error('Failed to add custom mistake');
    }
  };

  const filteredPredefinedMistakes = PREDEFINED_MISTAKES.filter(mistake => {
    const matchesSearch = mistake.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mistake.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || mistake.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredCustomMistakes = customMistakes.filter(mistake => {
    return mistake.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isSelected = (mistakeId: string) => {
    return selectedMistakes.some(m => m.mistakeType === mistakeId);
  };

  const getSeverityColor = (severity: MistakeSeverity) => {
    switch (severity) {
      case 'LOW': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search mistakes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {MISTAKE_CATEGORIES.map(cat => {
              const Icon = CATEGORY_ICONS[cat.category];
              return (
                <SelectItem key={cat.id} value={cat.category}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {cat.name}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Predefined Mistakes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Predefined Mistakes</h3>
        <div className="grid gap-3">
          {MISTAKE_CATEGORIES.map(category => {
            const categoryMistakes = filteredPredefinedMistakes.filter(m => m.category === category.category);
            if (categoryMistakes.length === 0) return null;

            const Icon = CATEGORY_ICONS[category.category];
            
            return (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5" />
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categoryMistakes.map(mistake => {
                    const frequency = mistakeFrequency[mistake.id] || 0;
                    const selected = isSelected(mistake.id);
                    
                    return (
                      <div
                        key={mistake.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-colors",
                          selected ? "bg-primary/10 border-primary" : "hover:bg-muted"
                        )}
                        onClick={() => handleMistakeToggle(mistake.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Checkbox checked={selected} readOnly />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{mistake.label}</span>
                                {frequency > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {frequency}x
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {mistake.description}
                              </p>
                              {mistake.learningTip && (
                                <p className="text-xs text-blue-600 mt-1">
                                  💡 {mistake.learningTip}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Mistakes */}
      {filteredCustomMistakes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Custom Mistakes</h3>
          </div>
          <div className="grid gap-2">
            {filteredCustomMistakes.map(mistake => {
              const frequency = mistakeFrequency[mistake.id] || 0;
              const selected = isSelected(mistake.id);
              
              return (
                <div
                  key={mistake.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    selected ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  )}
                  onClick={() => handleMistakeToggle(mistake.id, true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={selected} readOnly />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{mistake.label}</span>
                          {frequency > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {frequency}x
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{mistake.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Custom Mistake */}
      <div className="space-y-4">
        {!showCustomForm ? (
          <Button
            variant="outline"
            onClick={() => setShowCustomForm(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Mistake
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Add Custom Mistake</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomForm(false)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mistake Label</Label>
                  <Input
                    placeholder="e.g., Overtrading after news"
                    value={customMistake.label}
                    onChange={(e) => setCustomMistake(prev => ({ ...prev, label: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={customMistake.severity}
                    onValueChange={(value: MistakeSeverity) => 
                      setCustomMistake(prev => ({ ...prev, severity: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Emotional State (Optional)</Label>
                <Select
                  value={customMistake.emotionalState || ''}
                  onValueChange={(value) => 
                    setCustomMistake(prev => ({ 
                      ...prev, 
                      emotionalState: value ? value as EmotionalState : undefined 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select emotional state" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMOTIONAL_STATES.map(state => (
                      <SelectItem key={state.value} value={state.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", state.color)} />
                          {state.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Describe what happened..."
                  value={customMistake.notes}
                  onChange={(e) => setCustomMistake(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCustomMistakeAdd}>
                  Add Mistake
                </Button>
                <Button variant="outline" onClick={() => setShowCustomForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Mistakes Details */}
      {selectedMistakes.length > 0 && (
        <div className="space-y-4">
          <Separator />
          <h3 className="text-lg font-semibold">Selected Mistakes ({selectedMistakes.length})</h3>
          <div className="space-y-4">
            {selectedMistakes.map((mistake, index) => {
              const predefinedMistake = PREDEFINED_MISTAKES.find(p => p.id === mistake.mistakeType);
              const customMistake = customMistakes.find(c => c.id === mistake.mistakeType);
              const label = predefinedMistake?.label || mistake.customLabel || 'Unknown Mistake';
              
              return (
                <Card key={`${mistake.mistakeType}-${index}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{label}</span>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", getSeverityColor(mistake.severity))} />
                        <Badge
                          variant="secondary"
                          onClick={() => handleMistakeToggle(mistake.mistakeType)}
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        >
                          Remove
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Severity</Label>
                        <Select
                          value={mistake.severity}
                          onValueChange={(value: MistakeSeverity) => 
                            handleMistakeUpdate(index, { severity: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Emotional State</Label>
                        <Select
                          value={mistake.emotionalState || ''}
                          onValueChange={(value) => 
                            handleMistakeUpdate(index, { 
                              emotionalState: value ? value as EmotionalState : undefined 
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMOTIONAL_STATES.map(state => (
                              <SelectItem key={state.value} value={state.value}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", state.color)} />
                                  {state.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="What happened? Context, market conditions, etc."
                        value={mistake.notes || ''}
                        onChange={(e) => handleMistakeUpdate(index, { notes: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Learning Points</Label>
                      <Textarea
                        placeholder="What did you learn from this mistake?"
                        value={mistake.learningPoints || ''}
                        onChange={(e) => handleMistakeUpdate(index, { learningPoints: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Prevention Strategy</Label>
                      <Textarea
                        placeholder="How will you prevent this mistake in the future?"
                        value={mistake.preventionStrategy || ''}
                        onChange={(e) => handleMistakeUpdate(index, { preventionStrategy: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}