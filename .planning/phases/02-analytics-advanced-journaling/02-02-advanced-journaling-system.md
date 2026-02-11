---
phase: 02-analytics-advanced-journaling
plan: 02
type: execute
wave: 2
depends_on: ["02-01"]
files_modified:
  - src/types/journal.ts
  - src/lib/storage/supabase-storage.ts
  - src/lib/audio/voice-recorder.ts
  - src/components/journaling/voice-recorder.tsx
  - src/components/journaling/file-upload.tsx
  - src/components/journaling/trade-journal.tsx
  - src/components/journaling/journal-entry.tsx
  - src/app/api/journal/entries/route.ts
  - src/app/api/journal/upload/route.ts
  - prisma/schema.prisma
autonomous: true
user_setup:
  - service: supabase
    why: "File storage for voice recordings and screenshots"
    env_vars:
      - name: NEXT_PUBLIC_SUPABASE_URL
        source: "Supabase Dashboard -> Settings -> API"
      - name: NEXT_PUBLIC_SUPABASE_ANON_KEY
        source: "Supabase Dashboard -> Settings -> API"
      - name: SUPABASE_SERVICE_ROLE_KEY
        source: "Supabase Dashboard -> Settings -> API"
    dashboard_config:
      - task: "Create storage bucket 'journal-files'"
        location: "Supabase Dashboard -> Storage"
      - task: "Configure RLS policies for authenticated access"
        location: "Supabase Dashboard -> Storage -> Policies"

must_haves:
  truths:
    - "User can add text notes to any trade or position"
    - "User can record and play back voice notes attached to trades"
    - "User can upload screenshots and view them in trade details"
    - "User can add tags and star ratings to trades for categorization"
    - "Journal entries persist and are searchable across all trades"
  artifacts:
    - path: "src/types/journal.ts"
      provides: "Journal entry, voice note, and file upload types"
      min_lines: 60
    - path: "src/lib/audio/voice-recorder.ts"
      provides: "MediaRecorder wrapper with cross-browser support"
      exports: ["useVoiceRecorder", "AudioRecorderState"]
    - path: "src/components/journaling/voice-recorder.tsx"
      provides: "Voice recording UI component"
      min_lines: 80
    - path: "prisma/schema.prisma"
      provides: "JournalEntry and JournalFile models"
      contains: "model JournalEntry"
  key_links:
    - from: "src/components/journaling/trade-journal.tsx"
      to: "/api/journal/entries"
      via: "journal CRUD operations"
      pattern: "fetch.*api/journal/entries"
    - from: "src/components/journaling/voice-recorder.tsx"
      to: "src/lib/audio/voice-recorder.ts"
      via: "MediaRecorder hook"
      pattern: "useVoiceRecorder"
    - from: "src/lib/storage/supabase-storage.ts"
      to: "Supabase Storage API"
      via: "file upload operations"
      pattern: "supabase.storage"
---

<objective>
Implement comprehensive journaling system with voice recording, file uploads, and rich text notes.

Purpose: Enable traders to add detailed context and learning notes to their trades and positions
Output: Full-featured journaling system with multimedia support and search capabilities
</objective>

<execution_context>
@/Users/husammeshri/.claude/get-shit-done/workflows/execute-plan.md
@/Users/husammeshri/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/research/phase-2-research.md
@src/types/trade.ts
@src/types/position.ts
@src/components/analytics/trades-table.tsx
</context>

<tasks>

<task type="auto">
  <name>Create Journal Types and Database Schema</name>
  <files>
    src/types/journal.ts
    prisma/schema.prisma
  </files>
  <action>
    Create comprehensive journal types in src/types/journal.ts:
    - JournalEntry interface with id, type (trade/position/general), targetId, userId, title, content, tags, rating (1-5), createdAt, updatedAt
    - JournalFile interface for attachments with id, journalEntryId, fileName, fileType, fileSize, storageUrl, uploadedAt
    - VoiceNote interface extending JournalFile with duration, transcript (optional)
    - JournalTag interface for categorization
    - SearchFilters interface for journal search functionality
    - AudioRecorderState type for voice recording component state
    
    Update prisma/schema.prisma to add journal models:
    - JournalEntry model with text content, tags array, rating, timestamps
    - JournalFile model for file attachments with proper relations
    - JournalTag model for tag management
    - Add relations to Trade and Position models for linked journaling
    - Include indexes for search performance
    
    Run prisma db push to apply changes.
  </action>
  <verify>npx prisma db push succeeds and journal models appear in schema</verify>
  <done>Journal database schema supports text notes, file attachments, tags, and ratings</done>
</task>

<task type="auto">
  <name>Create Supabase Storage Integration</name>
  <files>
    src/lib/storage/supabase-storage.ts
  </files>
  <action>
    Create Supabase storage integration following research recommendations:
    - Initialize Supabase client with environment variables
    - uploadFile function with validation (type checking, 5MB size limit)
    - downloadFile function for retrieving stored files
    - deleteFile function for cleanup
    - generateSignedUrl function for secure file access
    - Support for audio files (webm, mp4, wav) and images (png, jpg, webp)
    - Progress callback support for upload progress indication
    - Error handling for network issues, storage limits, permissions
    - File path organization: journal-files/{userId}/{entryId}/{filename}
    
    Follow research pattern for file upload with proper validation and security.
  </action>
  <verify>File upload functions compile correctly and handle mock files without errors</verify>
  <done>Supabase storage integration ready for voice and image file operations</done>
</task>

<task type="auto">
  <name>Create Voice Recording Utilities</name>
  <files>
    src/lib/audio/voice-recorder.ts
  </files>
  <action>
    Create MediaRecorder wrapper following research recommendations:
    - useVoiceRecorder React hook with state management
    - Cross-browser format detection (webm/opus, webm, mp4, wav fallbacks)
    - Recording state: idle, recording, paused, stopped
    - Functions: startRecording, stopRecording, pauseRecording, resumeRecording
    - Automatic cleanup of MediaStream tracks
    - Duration tracking with real-time updates
    - Error handling for permissions, unsupported browsers, hardware issues
    - Export audio blob with proper MIME type
    - Memory leak prevention with proper stream cleanup
    
    Use MediaRecorder.isTypeSupported() for format detection as per research.
    Include Safari-specific workarounds for iOS compatibility.
  </action>
  <verify>npm run type-check passes and hook structure is valid</verify>
  <done>Voice recording utilities support cross-browser audio capture with proper cleanup</done>
</task>

<task type="auto">
  <name>Create Voice Recorder UI Component</name>
  <files>
    src/components/journaling/voice-recorder.tsx
  </files>
  <action>
    Create voice recording component following research pattern:
    - Use useVoiceRecorder hook for recording functionality
    - Recording button with visual states (idle, recording, paused)
    - Real-time duration display during recording
    - Audio playback controls after recording completion
    - Waveform visualization using simple CSS animation during recording
    - Record/Stop/Pause/Resume controls with proper keyboard accessibility
    - File size estimation and format display
    - Error handling with user-friendly messages
    - Integration with onRecordingComplete callback for parent components
    - Support for re-recording and discarding recordings
    
    Use shadcn/ui Button, Card, and Progress components for consistent styling.
    Include proper ARIA labels for accessibility.
  </action>
  <verify>Component renders without errors and shows recording controls</verify>
  <done>Voice recorder component provides professional audio recording interface</done>
</task>

<task type="auto">
  <name>Create File Upload Component</name>
  <files>
    src/components/journaling/file-upload.tsx
  </files>
  <action>
    Create file upload component with drag-and-drop support:
    - Drag-and-drop zone with visual feedback
    - File type validation (images: png, jpg, webp, gif)
    - File size validation (5MB limit per research)
    - Upload progress indication with cancel option
    - Image preview for uploaded images
    - Multiple file selection support
    - Error handling with specific error messages
    - Integration with Supabase storage via storage utility
    - File list with remove option before upload
    - Accessibility support for keyboard navigation
    
    Use shadcn/ui components for consistent styling.
    Follow research recommendations for file validation and upload patterns.
  </action>
  <verify>Component renders and accepts file drops without errors</verify>
  <done>File upload component supports images with validation and progress feedback</done>
</task>

<task type="auto">
  <name>Create Journal Entry Components</name>
  <files>
    src/components/journaling/journal-entry.tsx
    src/components/journaling/trade-journal.tsx
  </files>
  <action>
    Create journal-entry.tsx for individual journal entries:
    - Rich text editor using textarea with markdown-style shortcuts
    - Tag input with autocomplete from existing tags
    - Star rating component (1-5 stars)
    - Voice recorder integration
    - File upload integration
    - Entry metadata display (created, modified dates)
    - Edit/save/cancel functionality
    - Delete confirmation dialog
    
    Create trade-journal.tsx as container component:
    - Display all journal entries for a trade/position
    - Add new entry button and form
    - Search and filter journal entries
    - Entry type selection (pre-trade plan, during-trade notes, post-trade review)
    - Integration with trade/position data
    - Loading states and error handling
    - Responsive layout for mobile compatibility
    
    Use existing UI patterns from analytics components for consistency.
  </action>
  <verify>Components render and show journal entry interface correctly</verify>
  <done>Journal components provide complete entry creation and management interface</done>
</task>

<task type="auto">
  <name>Create Journal API Endpoints</name>
  <files>
    src/app/api/journal/entries/route.ts
    src/app/api/journal/upload/route.ts
  </files>
  <action>
    Create journal entries API (entries/route.ts):
    - GET: Fetch journal entries with filtering (by trade, position, tags, date range)
    - POST: Create new journal entry with validation
    - PUT: Update existing journal entry
    - DELETE: Remove journal entry and associated files
    - Support query params: type, targetId, tags, search, dateFrom, dateTo
    - Include proper authentication using Clerk
    - Validation using Zod schemas
    - Error handling and proper HTTP status codes
    
    Create file upload API (upload/route.ts):
    - POST: Upload voice recordings and images to Supabase
    - File validation (type, size) before upload
    - Generate unique file names with timestamps
    - Return file metadata for journal entry association
    - Cleanup on upload failure
    - Rate limiting protection
    
    Follow existing API patterns from analytics endpoints.
  </action>
  <verify>API endpoints return valid JSON responses and handle authentication</verify>
  <done>Journal API supports full CRUD operations for entries and file uploads</done>
</task>

</tasks>

<verification>
JOUR-01: User can add text notes to entry trades ✓
JOUR-02: User can add text notes to exit trades ✓  
JOUR-03: User can record voice notes for entry and exit trades ✓
JOUR-04: User can upload screenshots for trades ✓
JOUR-05: User can add tags to categorize trades ✓
JOUR-06: User can search through notes and tags ✓
JOUR-07: User can rate trades (1-5 stars) ✓
Voice recordings work across browsers with proper cleanup ✓
File uploads integrate with Supabase storage securely ✓
</verification>

<success_criteria>
- Users can add rich text notes to any trade or position
- Voice recording works across browsers with proper audio format detection
- File uploads support images with validation and progress feedback
- Journal entries are searchable by content, tags, and metadata
- All multimedia content stores securely in Supabase with proper access controls
- Journal interface integrates seamlessly with existing trade analytics
- Components follow established design patterns and accessibility standards
</success_criteria>

<output>
After completion, create `.planning/phases/02-analytics-advanced-journaling/02-02-advanced-journaling-system-SUMMARY.md`
</output>