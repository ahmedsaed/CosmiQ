# Phase 3 Enhancement: Completed and Remaining Work

## ✅ What I've Completed

### 1. API Client Extensions (`app/src/lib/api-client.ts`)

**Added New Methods**:
```typescript
// Search with flexible options
async searchNotebook(query, options?: {
  searchType?: 'text' | 'vector',
  limit?: number,
  notebookId?: string,
  ...
}): Promise<SearchResponse>

// Simple ask (non-streaming)
async askQuestion(
  question, 
  strategyModel, 
  answerModel, 
  finalAnswerModel
): Promise<AskResponse>

// Streaming ask
async askStream(
  question,
  models,
  onChunk: (data) => void,
  onComplete: () => void,
  onError: (error) => void
): Promise<void>

// Podcast generation
async generatePodcast(
  episodeProfile,
  speakerProfile,
  episodeName,
  notebookId?,
  content?,
  briefingSuffix?
): Promise<PodcastJob>

async getPodcastJobStatus(jobId): Promise<any>
async getPodcastEpisodes(notebookId?): Promise<PodcastEpisode[]>
async getPodcastEpisode(episodeId): Promise<PodcastEpisode>
async deletePodcastEpisode(episodeId): Promise<void>
```

### 2. Type Definitions (`app/src/types/api.ts`)

**New Types Added**:
```typescript
// Search
export interface SearchResult {
  id: string;
  title: string | null;
  content: string | null;
  type: 'source' | 'note';
  score: number;
  notebook_id: string;
  created: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  search_type: 'text' | 'vector';
  total: number;
}

// Ask
export interface AskResponse {
  answer: string;
  sources_used: SearchResult[];
  question: string;
}

// Podcast
export interface PodcastJob {
  job_id: string;
  status: string;
  message: string;
  episode_profile: string;
  episode_name: string;
}

export interface PodcastEpisode {
  id: string;
  name: string;
  description: string | null;
  audio_file_path: string | null;
  transcript: string | null;
  episode_profile: string;
  speaker_profile: string;
  notebook_id: string | null;
  created: string;
  updated: string;
}
```

### 3. SearchPanel Component (`app/src/components/notebook/SearchPanel.tsx`)

**✅ FULLY FUNCTIONAL** - Complete implementation with:
- Text/Vector search toggle
- Real-time search input
- Loading states
- Empty states
- Results display with:
  - Source/Note type icons
  - Title and content preview
  - Relevance scores
  - Query highlighting (text search only)
  - Click-to-view (ready for integration)
- Error handling
- Toast notifications
- Keyboard shortcuts (Enter to search)

**Usage**: Replace placeholder in `MiddleColumn.tsx`:
```tsx
import { SearchPanel } from './SearchPanel';

// In MiddleColumn component:
<SearchPanel notebookId={notebookId} />
```

---

## 🚧 What Needs to Be Implemented

### 1. Ask Panel Component (Priority: HIGH)

**File**: `app/src/components/notebook/AskPanel.tsx`

**Requirements**:
- Question input with multi-line support
- Model selection (dropdown with 3 models: strategy, answer, final)
- "Ask" button with loading state
- Streaming response display:
  - Show typing indicator while streaming
  - Display answer chunks as they arrive
  - Format markdown in responses
- Conversation history (optional - show recent Q&A pairs)
- "Save as Note" button to save answer
- Error handling and empty states

**API Integration**:
```typescript
// Option 1: Streaming (recommended)
await apiClient.askStream(
  question,
  strategyModelId,
  answerModelId,
  finalAnswerModelId,
  (chunk) => {
    // Update UI with chunk.content
    if (chunk.type === 'answer' || chunk.type === 'final_answer') {
      appendToAnswer(chunk.content || chunk.final_answer);
    }
  },
  () => setIsComplete(true),
  (error) => showToast({ title: 'Error', description: error.message })
);

// Option 2: Simple (non-streaming)
const response = await apiClient.askQuestion(
  question,
  strategyModelId,
  answerModelId,
  finalAnswerModelId
);
setAnswer(response.answer);
```

**Models**: Fetch from `/api/models?type=language`

---

### 2. Podcast Generation Dialog & Status

**File**: `app/src/components/notebook/PodcastGenerationDialog.tsx`

**Requirements**:
- Modal/Dialog component
- Episode Profile selector (fetch from `/api/episode-profiles`)
- Speaker Profile selector (fetch from `/api/speaker-profiles`)
- Episode name input
- "Generate" button
- After submission:
  - Show job status (polling with `getPodcastJobStatus`)
  - Display progress messages
  - On completion, show success and refresh episodes list

**Integration in RightColumn**:
```tsx
const [dialogOpen, setDialogOpen] = useState(false);

// Replace alert() with:
<Button onClick={() => setDialogOpen(true)}>
  Generate Podcast
</Button>

<PodcastGenerationDialog
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
  notebookId={notebookId}
  onSuccess={() => {
    showToast({ title: 'Podcast generation started!' });
    // Refresh episodes list
  }}
/>
```

**Podcast Episodes List** (`app/src/components/notebook/PodcastEpisodesList.tsx`):
- Fetch episodes for notebook
- Display with audio player
- Download button
- Delete button
- Show transcript (optional)

---

### 3. Summary Generation (via Transformations)

**File**: `app/src/components/notebook/SummaryDialog.tsx`

**Requirements**:
- Model selector (language models)
- Optional: Transformation selector (fetch `/api/transformations`)
- Generate button
- Display generated summary
- "Save as Note" button
- Loading and error states

**API**:
```typescript
// Get notebook content
const notebook = await apiClient.getNotebook(notebookId);
const sources = await apiClient.getSources({ notebook_id: notebookId });
const content = sources.map(s => s.full_text).join('\n\n');

// Option 1: Use default "summary" transformation
const result = await apiClient.executeTransformation(
  'summary_transformation_id',
  content,
  modelId
);

// Option 2: Create custom prompt and use chat model
// (Depends on your backend setup)
```

---

### 4. Transformation Runner Dialog

**File**: `app/src/components/notebook/TransformationDialog.tsx`

**Requirements**:
- Transformation selector (dropdown from `/api/transformations`)
- Model selector
- Input source selector (which source to transform)
- Execute button
- Results display (show transformation output)
- Save as insight or note

**API**:
```typescript
const transformations = await apiClient.getTransformations();
const models = await apiClient.getModels({ type: 'language' });

// Execute on source
const result = await apiClient.executeTransformation(
  transformationId,
  sourceContent,
  modelId
);

// Save as insight
await apiClient.createSourceInsight(sourceId, transformationId);
```

---

### 5. Generated Items List

**File**: `app/src/components/notebook/GeneratedItemsList.tsx`

**Requirements**:
- Tabbed interface or sections:
  - **Podcasts**: List of generated podcasts with audio player
  - **Summaries**: List of saved summaries
  - **Insights**: List of source insights from transformations
- Actions for each item:
  - View/Play
  - Download (for podcasts)
  - Delete
  - Edit (for summaries/insights)

**API**:
```typescript
// Podcasts
const episodes = await apiClient.getPodcastEpisodes(notebookId);

// Insights
const sources = await apiClient.getSources({ notebook_id: notebookId });
// Iterate and fetch insights for each source
const insights = await apiClient.getSourceInsights(sourceId);

// Notes (for summaries saved as notes)
const notes = await apiClient.getNotes({ notebook_id: notebookId, note_type: 'ai' });
```

---

## 📝 Integration Steps

### Step 1: Replace MiddleColumn Placeholders

**File**: `app/src/components/notebook/MiddleColumn.tsx`

**Current**:
```tsx
export function MiddleColumn({ notebookId, sources, notes }: MiddleColumnProps) {
  return (
    <div className="space-y-6">
      {/* Placeholder divs */}
    </div>
  );
}
```

**Update To**:
```tsx
import { SearchPanel } from './SearchPanel';
import { AskPanel } from './AskPanel'; // TO BE CREATED

export function MiddleColumn({ notebookId, sources, notes }: MiddleColumnProps) {
  return (
    <div className="space-y-6">
      <SearchPanel notebookId={notebookId} />
      <AskPanel notebookId={notebookId} />
    </div>
  );
}
```

### Step 2: Update RightColumn

**File**: `app/src/components/notebook/RightColumn.tsx`

Replace `alert()` calls with:
1. PodcastGenerationDialog
2. SummaryDialog
3. TransformationDialog

Add GeneratedItemsList below the menu.

### Step 3: Update index.ts Barrel Export

**File**: `app/src/components/notebook/index.ts`

Add new exports:
```typescript
export { SearchPanel } from './SearchPanel';
export { AskPanel } from './AskPanel';
export { PodcastGenerationDialog } from './PodcastGenerationDialog';
export { SummaryDialog } from './SummaryDialog';
export { TransformationDialog } from './TransformationDialog';
export { GeneratedItemsList } from './GeneratedItemsList';
export { PodcastEpisodesList } from './PodcastEpisodesList';
```

---

## 🎨 Component Templates

### Template: AskPanel

```tsx
'use client';

import { useState } from 'react';
import { MessageSquare, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';

interface AskPanelProps {
  notebookId: string;
}

export function AskPanel({ notebookId }: AskPanelProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const { showToast } = useToast();

  const handleAsk = async () => {
    // TODO: Implement with model selection
    setIsAsking(true);
    try {
      const response = await apiClient.askQuestion(
        question,
        'strategy_model_id', // TODO: Get from selector
        'answer_model_id',
        'final_answer_model_id'
      );
      setAnswer(response.answer);
    } catch (error: any) {
      showToast({ title: 'Ask failed', description: error.message, variant: 'error' });
    } finally {
      setIsAsking(false);
    }
  };

  const handleSaveAsNote = async () => {
    // Save answer as AI note
    try {
      await apiClient.createNote({
        notebook_id: notebookId,
        content: answer,
        title: question.slice(0, 100),
        note_type: 'ai',
      });
      showToast({ title: 'Saved as note!', variant: 'success' });
    } catch (error: any) {
      showToast({ title: 'Failed to save', description: error.message, variant: 'error' });
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-secondary" />
        <h2 className="font-semibold text-text-primary">Ask</h2>
      </div>

      <Textarea
        placeholder="Ask a question about your sources..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        className="mb-3"
      />

      <Button
        onClick={handleAsk}
        disabled={!question.trim() || isAsking}
        leftIcon={isAsking ? <Loader2 className="animate-spin" /> : <MessageSquare />}
        className="w-full mb-4"
      >
        {isAsking ? 'Asking...' : 'Ask'}
      </Button>

      {answer && (
        <div className="glass-card p-4 bg-card/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">Answer</span>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Save />}
              onClick={handleSaveAsNote}
            >
              Save as Note
            </Button>
          </div>
          <div className="text-sm text-text-primary whitespace-pre-wrap">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Testing Checklist

Once all components are implemented:

1. **Search Panel**:
   - [ ] Text search returns results
   - [ ] Vector search returns results
   - [ ] Results show correct scores
   - [ ] Query highlighting works
   - [ ] Empty states display correctly

2. **Ask Panel**:
   - [ ] Question submission works
   - [ ] Streaming responses display (if using streaming)
   - [ ] Answers are readable and formatted
   - [ ] Save as note creates AI note
   - [ ] Model selection works

3. **Podcast Generation**:
   - [ ] Dialog opens with profiles
   - [ ] Generation starts successfully
   - [ ] Job status polling works
   - [ ] Completed podcast appears in list
   - [ ] Audio player works
   - [ ] Download button works

4. **Summary/Transformations**:
   - [ ] Transformation selector populated
   - [ ] Execution works on sources
   - [ ] Results display correctly
   - [ ] Save functionality works

5. **Generated Items**:
   - [ ] Podcasts list shows all episodes
   - [ ] Insights list shows transformations
   - [ ] Delete actions work
   - [ ] Play/View actions work

---

## 🔥 Priority Order

1. **HIGHEST**: AskPanel (most user-facing feature)
2. **HIGH**: Update MiddleColumn to use SearchPanel + AskPanel
3. **MEDIUM**: PodcastGenerationDialog + PodcastEpisodesList
4. **MEDIUM**: GeneratedItemsList (at least show podcasts)
5. **LOW**: SummaryDialog and TransformationDialog (nice-to-have)

---

## 🎯 Quick Win

**Immediate Action**: Replace MiddleColumn placeholders with SearchPanel:

```bash
# Edit: app/src/components/notebook/MiddleColumn.tsx
```

Change from placeholder to:
```tsx
import { SearchPanel } from './SearchPanel';

export function MiddleColumn({ notebookId }: MiddleColumnProps) {
  return (
    <div className="space-y-6">
      <SearchPanel notebookId={notebookId} />
      
      {/* Keep Ask placeholder for now */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-secondary" />
          <h2 className="font-semibold text-text-primary">Ask</h2>
        </div>
        <div className="text-center py-12 text-text-tertiary">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Ask functionality coming soon</p>
        </div>
      </div>
    </div>
  );
}
```

This will get the fully functional search working immediately!

---

## 📚 Backend API Reference

All APIs are already implemented and ready:

- `POST /api/search` - Text/vector search
- `POST /api/search/ask` - Streaming ask
- `POST /api/search/ask/simple` - Non-streaming ask
- `POST /api/podcasts/generate` - Start podcast generation
- `GET /api/podcasts/jobs/{job_id}` - Check job status
- `GET /api/podcasts/episodes?notebook_id={id}` - List episodes
- `GET /api/transformations` - List transformations
- `POST /api/transformations/execute` - Run transformation
- `GET /api/models?type=language` - List models
- `GET /api/episode-profiles` - List episode profiles
- `GET /api/speaker-profiles` - List speaker profiles

All endpoints are documented in the API client!

---

**Summary**: Search is complete and ready to test! The remaining components follow similar patterns (fetch data, display, handle actions). Focus on AskPanel next for immediate user value. ❤️
