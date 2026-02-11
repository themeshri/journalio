import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface FileUploadOptions {
  userId: string;
  entryId: string;
  file: File;
  onProgress?: (progress: number) => void;
}

export interface FileUploadResult {
  success: boolean;
  url?: string;
  filePath?: string;
  error?: string;
  fileSize?: number;
  mimeType?: string;
}

// File type validation
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/ogg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 5MB limit`
    };
  }

  // Check file type
  const isValidImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isValidAudio = ALLOWED_AUDIO_TYPES.includes(file.type);
  
  if (!isValidImage && !isValidAudio) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Allowed: images and audio files`
    };
  }

  return { valid: true };
}

export async function uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
  const { userId, entryId, file, onProgress } = options;
  
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Generate unique file path
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `journal-files/${userId}/${entryId}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('journal-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('journal-files')
      .getPublicUrl(filePath);

    // Simulate progress callback (Supabase doesn't provide real-time progress)
    if (onProgress) {
      onProgress(100);
    }

    return {
      success: true,
      url: urlData.publicUrl,
      filePath: filePath,
      fileSize: file.size,
      mimeType: file.type
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

export async function downloadFile(filePath: string): Promise<{ success: boolean; blob?: Blob; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('journal-files')
      .download(filePath);

    if (error) {
      console.error('Download error:', error);
      return {
        success: false,
        error: `Download failed: ${error.message}`
      };
    }

    return {
      success: true,
      blob: data
    };

  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown download error'
    };
  }
}

export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('journal-files')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: `Delete failed: ${error.message}`
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error'
    };
  }
}

export async function generateSignedUrl(filePath: string, expiresIn: number = 3600): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('journal-files')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return {
        success: false,
        error: `Signed URL generation failed: ${error.message}`
      };
    }

    return {
      success: true,
      signedUrl: data.signedUrl
    };

  } catch (error) {
    console.error('Signed URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown signed URL error'
    };
  }
}

export function getFileTypeFromMime(mimeType: string): 'image' | 'audio' | 'document' {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return 'image';
  }
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) {
    return 'audio';
  }
  return 'document';
}

// Utility function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export { supabase };