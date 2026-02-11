'use client';

import React, { useState, useEffect } from 'react';
import { Star, Edit, Trash2, Save, X, Tag, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VoiceRecorder } from './voice-recorder';
import { FileUpload } from './file-upload';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { JournalEntryWithFiles, JournalEntryFormData } from '@/types/journal';

interface JournalEntryProps {
  entry?: JournalEntryWithFiles;
  isEditing?: boolean;
  onSave?: (data: JournalEntryFormData) => Promise<void>;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
  className?: string;
  disabled?: boolean;
}

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair', 
  3: 'Good',
  4: 'Great',
  5: 'Excellent'
};

export function JournalEntry({
  entry,
  isEditing = false,
  onSave,
  onEdit,
  onDelete,
  onCancel,
  className,
  disabled = false
}: JournalEntryProps) {
  // Form state
  const [formData, setFormData] = useState<JournalEntryFormData>({
    title: entry?.title || '',
    content: entry?.content || '',
    tags: entry?.tags || [],
    rating: entry?.rating,
    type: entry?.type || 'general',
    targetId: entry?.targetId,
    files: [],
    voiceRecording: undefined
  });

  const [newTag, setNewTag] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update form data when entry changes
  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        content: entry.content,
        tags: entry.tags,
        rating: entry.rating,
        type: entry.type,
        targetId: entry.targetId,
        files: [],
        voiceRecording: undefined
      });
    }
  }, [entry]);

  // Handle rating change
  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  // Handle tag addition
  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ 
        ...prev, 
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle tag input keydown
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle voice recording complete
  const handleVoiceRecordingComplete = (audioBlob: Blob) => {
    setFormData(prev => ({ ...prev, voiceRecording: audioBlob }));
  };

  // Handle files selected
  const handleFilesSelected = (files: File[]) => {
    setFormData(prev => ({ ...prev, files }));
  };

  // Handle save
  const handleSave = async () => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      await onDelete();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
    }
  };

  // Render star rating
  const renderStarRating = (currentRating?: number, onRate?: (rating: number) => void) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          disabled={disabled || !onRate}
          className={cn(
            "transition-colors",
            onRate ? "hover:text-yellow-400 cursor-pointer" : "cursor-default",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Star
            className={cn(
              "h-4 w-4",
              currentRating && star <= currentRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        </button>
      ))}
      {currentRating && (
        <span className="text-sm text-muted-foreground ml-2">
          {RATING_LABELS[currentRating as keyof typeof RATING_LABELS]}
        </span>
      )}
    </div>
  );

  if (isEditing || !entry) {
    // Edit mode
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {entry ? 'Edit Journal Entry' : 'New Journal Entry'}
            </h3>
            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                disabled={disabled || isSaving || !formData.title.trim()}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  disabled={disabled || isSaving}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter journal entry title..."
              disabled={disabled || isSaving}
            />
          </div>

          {/* Content Textarea */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your journal entry here..."
              rows={6}
              disabled={disabled || isSaving}
            />
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    disabled={disabled || isSaving}
                    className="ml-1 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag..."
                disabled={disabled || isSaving}
              />
              <Button 
                onClick={handleAddTag}
                variant="outline"
                disabled={disabled || isSaving || !newTag.trim()}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            {renderStarRating(formData.rating, handleRatingChange)}
          </div>

          {/* Voice Recording */}
          <div className="space-y-2">
            <Label>Voice Note</Label>
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              disabled={disabled || isSaving}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <FileUpload
              onFilesSelected={handleFilesSelected}
              disabled={disabled || isSaving}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // View mode
  return (
    <>
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-grow space-y-1">
              <h3 className="text-lg font-semibold">{entry.title}</h3>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDistanceToNow(entry.createdAt, { addSuffix: true })}</span>
                </div>
                
                {entry.updatedAt !== entry.createdAt && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Updated {formatDistanceToNow(entry.updatedAt, { addSuffix: true })}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              {onEdit && (
                <Button
                  onClick={onEdit}
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              
              {onDelete && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Content */}
          <div className="whitespace-pre-wrap text-sm">{entry.content}</div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Rating */}
          {entry.rating && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Rating:</span>
              {renderStarRating(entry.rating)}
            </div>
          )}

          {/* Files and Voice Notes */}
          {(entry.files.length > 0 || entry.voiceNotes.length > 0) && (
            <div className="space-y-4 pt-4 border-t">
              {entry.files.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Attachments</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {entry.files.filter(f => f.fileType === 'image').map((file) => (
                      <div key={file.id} className="relative">
                        <img
                          src={file.storageUrl}
                          alt={file.fileName}
                          className="w-full h-20 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {entry.voiceNotes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Voice Notes</h4>
                  {entry.voiceNotes.map((note) => (
                    <div key={note.id} className="flex items-center space-x-2">
                      <audio controls className="flex-grow">
                        <source src={note.storageUrl} type={note.mimeType} />
                      </audio>
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(note.duration / 60)}:{String(note.duration % 60).padStart(2, '0')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}