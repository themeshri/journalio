'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Edit2, Save, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CustomMistake {
  id: string;
  name: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  color: string;
  usageCount?: number;
}

const SEVERITY_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

export function CustomMistakeManager() {
  const [mistakes, setMistakes] = useState<CustomMistake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    severity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    color: '#6b7280',
  });

  useEffect(() => {
    loadCustomMistakes();
  }, []);

  const loadCustomMistakes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/mistakes/custom');
      if (response.ok) {
        const data = await response.json();
        setMistakes(data.mistakes || []);
      }
    } catch (error) {
      console.error('Failed to load custom mistakes:', error);
      toast.error('Failed to load custom mistakes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `/api/mistakes/custom?id=${editingId}`
        : '/api/mistakes/custom';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingId ? 'Mistake updated' : 'Mistake created');
        await loadCustomMistakes();
        resetForm();
      } else {
        toast.error('Failed to save mistake');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save mistake');
    }
  };

  const handleEdit = (mistake: CustomMistake) => {
    setEditingId(mistake.id);
    setFormData({
      name: mistake.name,
      description: mistake.description,
      severity: mistake.severity,
      color: mistake.color,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mistake category?')) {
      return;
    }

    try {
      const response = await fetch(`/api/mistakes/custom?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Mistake deleted');
        await loadCustomMistakes();
      } else {
        toast.error('Failed to delete mistake');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete mistake');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      severity: 'MEDIUM',
      color: '#6b7280',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Predefined Categories Info */}
      <div className="text-sm text-muted-foreground mb-4">
        <p>In addition to predefined categories (FOMO Entry, Poor Risk Management, etc.), 
        you can create custom mistake categories specific to your trading style.</p>
      </div>

      {/* Add/Edit Form */}
      {showAddForm ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mistake-name">Name</Label>
                <Input
                  id="mistake-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Revenge Trading"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mistake-severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: any) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      severity: value,
                      color: SEVERITY_COLORS[value as keyof typeof SEVERITY_COLORS]
                    }))
                  }
                >
                  <SelectTrigger id="mistake-severity">
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
              <Label htmlFor="mistake-description">Description</Label>
              <Input
                id="mistake-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this mistake type"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowAddForm(true)} variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Custom Mistake
        </Button>
      )}

      {/* Mistakes List */}
      <div className="space-y-2">
        {mistakes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No custom mistakes created yet.</p>
              <p className="text-sm mt-2">Create custom mistake categories to track patterns specific to your trading.</p>
            </CardContent>
          </Card>
        ) : (
          mistakes.map((mistake) => (
            <Card key={mistake.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: mistake.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{mistake.name}</span>
                        <Badge 
                          variant="outline"
                          className={cn(
                            mistake.severity === 'HIGH' && 'border-red-500 text-red-500',
                            mistake.severity === 'MEDIUM' && 'border-orange-500 text-orange-500',
                            mistake.severity === 'LOW' && 'border-green-500 text-green-500'
                          )}
                        >
                          {mistake.severity}
                        </Badge>
                        {mistake.usageCount !== undefined && mistake.usageCount > 0 && (
                          <Badge variant="secondary">
                            Used {mistake.usageCount} times
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mistake.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(mistake)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(mistake.id)}
                      disabled={mistake.usageCount !== undefined && mistake.usageCount > 0}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}