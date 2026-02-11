export interface JournalEntry {
  id: string;
  type: 'trade' | 'position' | 'general';
  targetId?: string; // Trade ID, Position ID, or null for general entries
  userId: string;
  title: string;
  content: string;
  tags: string[];
  rating?: number; // 1-5 stars
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalFile {
  id: string;
  journalEntryId: string;
  fileName: string;
  fileType: 'image' | 'audio' | 'document';
  mimeType: string;
  fileSize: number; // in bytes
  storageUrl: string;
  uploadedAt: Date;
}

export interface VoiceNote extends JournalFile {
  fileType: 'audio';
  duration: number; // in seconds
  transcript?: string; // Optional auto-generated transcript
}

export interface JournalTag {
  id: string;
  name: string;
  color?: string; // Hex color for UI display
  userId: string;
  usageCount: number; // How many times this tag has been used
  createdAt: Date;
}

export interface SearchFilters {
  type?: 'trade' | 'position' | 'general';
  tags?: string[];
  rating?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Text search in title/content
  targetId?: string; // Filter by specific trade/position
}

export type AudioRecorderState = 
  | 'idle' 
  | 'recording' 
  | 'paused' 
  | 'stopped' 
  | 'error';

export interface RecordingSession {
  state: AudioRecorderState;
  duration: number; // in seconds
  audioBlob?: Blob;
  error?: string;
  format?: string; // Audio format (webm, mp4, wav, etc.)
}

export interface JournalEntryWithFiles extends JournalEntry {
  files: JournalFile[];
  voiceNotes: VoiceNote[];
}

export interface JournalAnalytics {
  totalEntries: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  averageRating: number;
  mostUsedTags: JournalTag[];
  entryTypes: {
    trade: number;
    position: number;
    general: number;
  };
}

export interface CreateJournalEntryData {
  type: 'trade' | 'position' | 'general';
  targetId?: string;
  title: string;
  content: string;
  tags?: string[];
  rating?: number;
}

export interface UpdateJournalEntryData extends Partial<CreateJournalEntryData> {
  id: string;
}

export interface FileUploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface JournalEntryFormData {
  title: string;
  content: string;
  tags: string[];
  rating?: number;
  type: 'trade' | 'position' | 'general';
  targetId?: string;
  files: File[];
  voiceRecording?: Blob;
}