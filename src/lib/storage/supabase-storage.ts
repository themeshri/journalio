// Mock storage implementation for demo purposes
// In production, this would use Supabase or another cloud storage service

export interface FileUploadOptions {
  userId: string;
  entryId: string;
  file: File;
  onProgress?: (progress: number) => void;
}

// Utility function to format file sizes
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export interface FileUploadResult {
  success: boolean;
  url?: string;
  filePath?: string;
  error?: string;
}

export interface VoiceNoteUploadOptions {
  userId: string;
  entryId: string;
  audioBlob: Blob;
  duration: number;
  onProgress?: (progress: number) => void;
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

// Mock file upload function
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

    // Simulate upload progress
    if (onProgress) {
      const steps = [0, 25, 50, 75, 100];
      for (const progress of steps) {
        await new Promise(resolve => setTimeout(resolve, 200));
        onProgress(progress);
      }
    }

    // Generate mock file path and URL
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `journal-files/${userId}/${entryId}/${fileName}`;
    const mockUrl = `https://demo-storage.chainjournal.app/${filePath}`;

    return {
      success: true,
      url: mockUrl,
      filePath: filePath
    };

  } catch (error) {
    console.error('Mock file upload error:', error);
    return {
      success: false,
      error: 'Upload failed (demo mode)'
    };
  }
}

// Mock voice note upload function
export async function uploadVoiceNote(options: VoiceNoteUploadOptions): Promise<FileUploadResult> {
  const { userId, entryId, audioBlob, duration, onProgress } = options;
  
  try {
    // Simulate upload progress
    if (onProgress) {
      const steps = [0, 30, 60, 90, 100];
      for (const progress of steps) {
        await new Promise(resolve => setTimeout(resolve, 150));
        onProgress(progress);
      }
    }

    // Generate mock file path and URL
    const timestamp = Date.now();
    const fileName = `voice-note-${timestamp}.webm`;
    const filePath = `voice-notes/${userId}/${entryId}/${fileName}`;
    const mockUrl = `https://demo-storage.chainjournal.app/${filePath}`;

    return {
      success: true,
      url: mockUrl,
      filePath: filePath
    };

  } catch (error) {
    console.error('Mock voice note upload error:', error);
    return {
      success: false,
      error: 'Voice note upload failed (demo mode)'
    };
  }
}

// Mock file deletion function
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Simulate deletion delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('Mock file deleted:', filePath);
    
    return { success: true };
  } catch (error) {
    console.error('Mock file deletion error:', error);
    return {
      success: false,
      error: 'File deletion failed (demo mode)'
    };
  }
}

// Mock function to get file URL
export function getFileUrl(filePath: string): string {
  return `https://demo-storage.chainjournal.app/${filePath}`;
}