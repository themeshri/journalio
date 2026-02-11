'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatFileSize } from '@/lib/storage/supabase-storage';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesSelected?: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  onUploadProgress?: (fileName: string, progress: number) => void;
  onUploadComplete?: (fileName: string, url: string) => void;
  onUploadError?: (fileName: string, error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

interface FileItem {
  file: File;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

const DEFAULT_ALLOWED_TYPES = [
  'image/png',
  'image/jpeg', 
  'image/jpg',
  'image/webp',
  'image/gif'
];

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function FileUpload({
  onFilesSelected,
  onFileRemove,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  disabled = false,
  className
}: FileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File size ${formatFileSize(file.size)} exceeds ${formatFileSize(maxFileSize)} limit`
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} not supported. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`
      };
    }

    return { valid: true };
  }, [maxFileSize, allowedTypes]);

  // Create preview for image files
  const createPreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(undefined);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle file selection
  const handleFiles = useCallback(async (selectedFiles: FileList) => {
    if (disabled) return;

    const newFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      const validation = validateFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      newFiles.push(file);
    }

    // Process valid files
    const fileItems: FileItem[] = [];
    for (const file of newFiles) {
      const preview = await createPreview(file);
      fileItems.push({
        file,
        preview,
        status: 'pending'
      });
    }

    const updatedFiles = [...files, ...fileItems];
    setFiles(updatedFiles);
    
    if (onFilesSelected) {
      onFilesSelected(updatedFiles.map(f => f.file));
    }

    // Show errors if any
    if (errors.length > 0) {
      console.warn('File upload errors:', errors);
    }
  }, [files, maxFiles, validateFile, createPreview, onFilesSelected, disabled]);

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      handleFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles) {
      handleFiles(droppedFiles);
    }
  }, [disabled, handleFiles]);

  // Remove file
  const removeFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    
    if (onFileRemove) {
      onFileRemove(index);
    }
    
    if (onFilesSelected) {
      onFilesSelected(updatedFiles.map(f => f.file));
    }
  }, [files, onFileRemove, onFilesSelected]);

  // Simulate upload progress (for demo purposes)
  const simulateUpload = useCallback((index: number) => {
    const fileItem = files[index];
    if (!fileItem || fileItem.status !== 'pending') return;

    // Update status to uploading
    const updatedFiles = [...files];
    updatedFiles[index] = { ...fileItem, status: 'uploading', progress: 0 };
    setFiles(updatedFiles);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10 + Math.random() * 20;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Mark as completed
        const finalFiles = [...files];
        finalFiles[index] = { 
          ...fileItem, 
          status: 'completed', 
          progress: 100,
          url: `https://example.com/uploads/${fileItem.file.name}`
        };
        setFiles(finalFiles);
        
        if (onUploadComplete) {
          onUploadComplete(fileItem.file.name, finalFiles[index].url!);
        }
      } else {
        // Update progress
        const progressFiles = [...files];
        progressFiles[index] = { ...fileItem, status: 'uploading', progress };
        setFiles(progressFiles);
        
        if (onUploadProgress) {
          onUploadProgress(fileItem.file.name, progress);
        }
      }
    }, 200);
  }, [files, onUploadProgress, onUploadComplete]);

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  // Get status icon
  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver ? "border-blue-500 bg-blue-50" : "border-muted-foreground/25",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-blue-400"
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-2">
            <Upload className={cn(
              "h-8 w-8",
              isDragOver ? "text-blue-500" : "text-muted-foreground"
            )} />
            <div className="text-sm">
              <span className="font-medium">
                {isDragOver ? "Drop files here" : "Click to upload or drag and drop"}
              </span>
              <p className="text-muted-foreground mt-1">
                {allowedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()} up to {formatFileSize(maxFileSize)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({files.length}/{maxFiles})</h4>
          
          {files.map((fileItem, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center space-x-3">
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      {getFileIcon(fileItem.file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(fileItem.status)}
                      
                      {fileItem.status === 'pending' && (
                        <Button
                          onClick={() => simulateUpload(index)}
                          size="sm"
                          variant="outline"
                          disabled={disabled}
                        >
                          Upload
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => removeFile(index)}
                        size="sm"
                        variant="ghost"
                        disabled={disabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {fileItem.status === 'uploading' && typeof fileItem.progress === 'number' && (
                    <div className="mt-2">
                      <Progress value={fileItem.progress} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploading... {Math.round(fileItem.progress)}%
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {fileItem.status === 'error' && fileItem.error && (
                    <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload All Button */}
      {files.some(f => f.status === 'pending') && (
        <Button
          onClick={() => {
            files.forEach((file, index) => {
              if (file.status === 'pending') {
                simulateUpload(index);
              }
            });
          }}
          className="w-full"
          disabled={disabled}
        >
          Upload All Files
        </Button>
      )}
    </div>
  );
}