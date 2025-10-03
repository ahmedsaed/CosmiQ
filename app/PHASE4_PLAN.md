# Phase 4 Implementation Plan 🚀

**Focus**: Refactoring, Chat Conversion, and Generations Integration

**Goals**:
1. Convert Ask feature to persistent Chat
2. Refactor and reuse components across the application
3. Complete the Generations tab (podcasts, summaries, transformations)
4. Improve code maintainability and performance

---

## 📋 Phase 4 Overview

### Priority Breakdown

**🔥 High Priority** (Week 1-2):
1. Convert Ask → Chat with persistent conversations
2. Refactor common components (lists, cards, modals)
3. Create shared hooks and utilities

**🎯 Medium Priority** (Week 2-3):
4. Implement Podcast Generation dialog and display
5. Implement Summary generation dialog
6. Implement Transformation runner dialog
7. Create GeneratedItemsList component

**✨ Polish Priority** (Week 3-4):
8. Add markdown rendering throughout
9. Performance optimizations
10. Accessibility improvements
11. Mobile responsive refinements

---

## 🔄 Task 1: Convert Ask to Chat (HIGH PRIORITY)

### Current State
- AskPanel shows streaming responses
- Basic conversation history (array of Q&A)
- No persistence beyond component state
- No editing or regeneration

### Target State
- Full chat interface with persistent threads
- Chat history stored in database
- Message editing and regeneration
- Export conversations as notes
- Context management (select which sources/notes to include)

### Implementation Plan

#### 1.1 Backend API Updates Needed ✅ (Already exists!)
Check if these endpoints exist:
- `GET /api/notebooks/{id}/conversations` - List chat threads
- `POST /api/notebooks/{id}/conversations` - Create new thread
- `GET /api/conversations/{id}/messages` - Get messages in thread
- `POST /api/conversations/{id}/messages` - Add message to thread
- `PUT /api/conversations/{id}/messages/{msg_id}` - Edit message
- `DELETE /api/conversations/{id}/messages/{msg_id}` - Delete message

**If missing**: Backend work required (out of scope for frontend)

#### 1.2 Update API Client
**File**: `app/src/lib/api-client.ts`

Add methods:
```typescript
// Conversations
async getConversations(notebookId: string): Promise<Conversation[]>
async createConversation(notebookId: string, name?: string): Promise<Conversation>
async getConversationMessages(conversationId: string): Promise<Message[]>
async addMessage(conversationId: string, message: CreateMessageData): Promise<Message>
async editMessage(conversationId: string, messageId: string, content: string): Promise<Message>
async deleteMessage(conversationId: string, messageId: string): Promise<void>
async regenerateMessage(conversationId: string, messageId: string, models?: ModelSelection): Promise<Message>
```

#### 1.3 Update Types
**File**: `app/src/types/api.ts`

Add types:
```typescript
export interface Conversation {
  id: string;
  notebook_id: string;
  name?: string;
  created: string;
  updated: string;
  message_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  models?: ModelSelection;
  references?: string[];
  created: string;
  edited?: string;
}

export interface CreateMessageData {
  role: 'user' | 'assistant';
  content: string;
  models?: ModelSelection;
}

export interface ModelSelection {
  strategy?: string;
  answer?: string;
  final_answer?: string;
}
```

#### 1.4 Rename and Refactor AskPanel → ChatPanel
**File**: `app/src/components/notebook/AskPanel.tsx` → `ChatPanel.tsx`

**Changes**:
1. Add conversation selector dropdown at top
2. Replace local `history` state with API-backed messages
3. Add message actions:
   - Edit button (for user messages)
   - Regenerate button (for AI messages)
   - Delete button (both)
   - Copy button (both)
4. Add "New Chat" button
5. Add "Export as Note" for entire conversation
6. Persist model selections per message
7. Show timestamp for each message
8. Add loading states for history fetching

**UI Updates**:
```tsx
// Top section
┌─────────────────────────────────────────────────┐
│ 💬 Chat                            [New Chat]   │
│ ┌─────────────────────────────────────────────┐ │
│ │ Conversation: [Select or "Default"]      ▼│ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Message History (scrollable)                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ 👤 User (2 min ago)                  [⋮]   │ │
│ │ What is the main topic?                     │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🤖 AI (2 min ago)                    [⋮]   │ │
│ │ The main topic is... [source:123]           │ │
│ │ Models: gpt-4, claude-3-opus                │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Input Section                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ Type your question...                       │ │
│ └─────────────────────────────────────────────┘ │
│ [Strategy ▼] [Answer ▼] [Final ▼]    [Send →] │
└─────────────────────────────────────────────────┘
```

**Message Actions Menu**:
- User messages: Edit, Delete, Copy
- AI messages: Regenerate, Delete, Copy, Save as Note

#### 1.5 Update MiddleColumn
**File**: `app/src/components/notebook/MiddleColumn.tsx`

Change:
```typescript
import { ChatPanel } from './ChatPanel'; // was AskPanel
```

#### 1.6 Create Conversation Selector Component
**File**: `app/src/components/notebook/ConversationSelector.tsx` (NEW)

**Features**:
- Dropdown with list of conversations
- Show conversation name and message count
- "New Chat" option
- Delete conversation action (with confirm)
- Rename conversation inline

---

## 🔧 Task 2: Refactor Common Components (HIGH PRIORITY)

### Goal
Extract reusable patterns into shared components to reduce duplication and improve maintainability.

### 2.1 Create Shared List Component
**File**: `app/src/components/shared/ScrollableList.tsx` (NEW)

**Purpose**: DRY up SourcesList, NotesList, SearchResults, etc.

**Props**:
```typescript
interface ScrollableListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  loading?: boolean;
  maxHeight?: string;
  className?: string;
}
```

**Usage**:
```tsx
<ScrollableList
  items={sources}
  renderItem={(source) => (
    <SourceCard key={source.id} source={source} onUpdate={handleUpdate} />
  )}
  emptyState={<EmptyState message="No sources yet" />}
  loading={loadingSources}
  maxHeight="calc(100vh - 300px)"
/>
```

**Refactor These Components**:
- `SourcesList` in LeftColumn
- `NotesList` in LeftColumn
- Search results in SearchPanel
- Message history in ChatPanel

---

### 2.2 Create Shared Card Component
**File**: `app/src/components/shared/BaseCard.tsx` (NEW)

**Purpose**: Base card with hover effects, click handling, menu button

**Props**:
```typescript
interface BaseCardProps {
  onClick?: () => void;
  onMenuClick?: () => void;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  title: string;
  subtitle?: string;
  preview?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}
```

**Refactor These Components**:
- `SourceCard` → extends BaseCard
- `NoteCard` → extends BaseCard
- `SearchResultCard` (if created) → extends BaseCard
- `PodcastCard` (future) → extends BaseCard

---

### 2.3 Create Shared Modal Component
**File**: `app/src/components/shared/BaseModal.tsx` (NEW)

**Purpose**: Base modal with portal, backdrop, close handling

**Features**:
- Portal to document.body (already established pattern)
- Backdrop click to close
- ESC key handling
- Loading state
- Mounted check for SSR
- Customizable size (sm, md, lg, xl, full)
- Optional header with title and close button
- Optional footer with action buttons

**Props**:
```typescript
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showHeader?: boolean;
  showCloseButton?: boolean;
  loading?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```

**Refactor These Components**:
- `ReferenceModal` → uses BaseModal
- `SourceDetailModal` → uses BaseModal
- `NoteDetailModal` → uses BaseModal
- `AddSourceDialog` → uses BaseModal
- `AddNoteDialog` → uses BaseModal
- All future dialogs → use BaseModal

---

### 2.4 Create Shared Hooks
**File**: `app/src/hooks/` (NEW DIRECTORY)

#### `useNotebook.ts`
```typescript
export function useNotebook(notebookId: string) {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notebook
  // Refresh method
  // Update method

  return { notebook, loading, error, refresh, update };
}
```

#### `useSources.ts`
```typescript
export function useSources(notebookId: string) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sources
  // Add, update, delete methods
  // Optimistic updates

  return { sources, loading, addSource, updateSource, deleteSource, refresh };
}
```

#### `useNotes.ts` (similar to useSources)

#### `useModels.ts`
```typescript
export function useModels(type?: string) {
  // Fetch and cache models
  // Get defaults
  // Update defaults
}
```

#### `useToast.ts`
```typescript
export function useToast() {
  const showSuccess = (message: string) => { /* ... */ };
  const showError = (message: string) => { /* ... */ };
  const showInfo = (message: string) => { /* ... */ };

  return { showSuccess, showError, showInfo };
}
```

---

### 2.5 Create Utility Functions
**File**: `app/src/lib/utils.ts` (EXPAND EXISTING)

Add utilities:
```typescript
// Date formatting
export function formatDate(date: string | Date): string

// Text truncation
export function truncate(text: string, maxLength: number): string

// Score formatting
export function formatScore(score: number): string // Returns "85%"

// Reference parsing (extract from AskPanel)
export function parseReferences(text: string): string[]

// Content preview (extract from multiple places)
export function getContentPreview(content: string, maxLength: number): string

// Type badges (extract from multiple places)
export function getSourceTypeLabel(type: string): string
export function getSourceTypeIcon(type: string): React.ReactNode
```

---

## 🎙️ Task 3: Implement Podcast Generation (MEDIUM PRIORITY)

### 3.1 Create Podcast Generation Dialog
**File**: `app/src/components/notebook/PodcastGenerationDialog.tsx` (NEW)

**Features**:
- Episode profile selector (fetch from `/api/episode-profiles`)
- Speaker profile selector (fetch from `/api/speaker-profiles`)
- Episode name input
- Optional description textarea
- "Generate" button
- Job status display with progress bar
- Polling mechanism for job completion
- Success message with link to episode

**UI**:
```tsx
┌────────────────────────────────────────────┐
│ 🎙️ Generate Podcast              [✕]     │
├────────────────────────────────────────────┤
│                                            │
│ Episode Profile                            │
│ ┌────────────────────────────────────────┐ │
│ │ Select episode profile...           ▼│ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Speaker Profile                            │
│ ┌────────────────────────────────────────┐ │
│ │ Select speaker profile...           ▼│ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Episode Name *                             │
│ ┌────────────────────────────────────────┐ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Description (optional)                     │
│ ┌────────────────────────────────────────┐ │
│ │                                        │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ [Cancel]            [Generate Podcast →]  │
└────────────────────────────────────────────┘

// While generating:
┌────────────────────────────────────────────┐
│ 🎙️ Generating Podcast...         [✕]     │
├────────────────────────────────────────────┤
│                                            │
│ Status: Processing content...              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  75%      │
│                                            │
│ This may take a few minutes. You can      │
│ close this dialog and check back later.   │
│                                            │
│                     [Close]                │
└────────────────────────────────────────────┘
```

**Implementation**:
1. Fetch profiles on mount
2. Form validation
3. Submit → call `apiClient.generatePodcast()`
4. Get job ID, start polling `getPodcastJobStatus()` every 5 seconds
5. Update progress bar based on status
6. On completion, show success and refresh episodes list
7. Handle errors (job failed, timeout, etc.)

---

### 3.2 Create Podcast Episodes List
**File**: `app/src/components/notebook/PodcastEpisodesList.tsx` (NEW)

**Features**:
- List all podcast episodes for notebook
- Each episode card shows:
  - Episode name
  - Duration
  - Creation date
  - Audio player (HTML5 `<audio>` element)
  - Download button
  - Delete button (with confirm)
- Empty state when no episodes
- Loading state
- Auto-refresh when new episode generated

**UI**:
```tsx
┌────────────────────────────────────────────┐
│ Episode: "Intro to CosmiQ"                 │
│ Created: 2 hours ago • Duration: 15:30     │
│ ┌────────────────────────────────────────┐ │
│ │ [▶️] ━━━━━━━━●━━━━━━━━━━━ 5:30 / 15:30│ │
│ └────────────────────────────────────────┘ │
│ [Download 📥] [Delete 🗑️]                  │
└────────────────────────────────────────────┘
```

**Implementation**:
1. Fetch episodes on mount: `apiClient.getPodcastEpisodes(notebookId)`
2. Render each episode with `PodcastEpisodeCard` component
3. Audio player with controls
4. Download: fetch audio URL and trigger download
5. Delete: confirm dialog → call `deletePodcastEpisode()` → refresh list

---

### 3.3 Update RightColumn
**File**: `app/src/components/notebook/RightColumn.tsx`

**Changes**:
1. Import PodcastGenerationDialog and PodcastEpisodesList
2. Add state for dialog open/close
3. Replace alert() with dialog open
4. Add PodcastEpisodesList component
5. Pass refresh callback to dialog

**Updated Structure**:
```tsx
<div className="space-y-6">
  {/* Generation Menu */}
  <div className="glass-card p-4">
    <h3>⚡ Generate</h3>
    <Button onClick={() => setPodcastDialogOpen(true)}>
      🎙️ Generate Podcast
    </Button>
    <Button onClick={() => setSummaryDialogOpen(true)}>
      📝 Create Summary
    </Button>
    <Button onClick={() => setTransformDialogOpen(true)}>
      🔮 Run Transformation
    </Button>
  </div>

  {/* Generated Items */}
  <div className="glass-card p-4">
    <h3>📦 Generated Content</h3>
    <Tabs>
      <TabsList>
        <Tab>Podcasts</Tab>
        <Tab>Summaries</Tab>
        <Tab>Insights</Tab>
      </TabsList>
      <TabsContent value="podcasts">
        <PodcastEpisodesList notebookId={notebookId} />
      </TabsContent>
      {/* Other tabs... */}
    </Tabs>
  </div>

  {/* Dialogs */}
  <PodcastGenerationDialog
    isOpen={podcastDialogOpen}
    onClose={() => setPodcastDialogOpen(false)}
    notebookId={notebookId}
    onSuccess={handlePodcastGenerated}
  />
</div>
```

---

## 📝 Task 4: Implement Summary Generation (MEDIUM PRIORITY)

### 4.1 Create Summary Dialog
**File**: `app/src/components/notebook/SummaryDialog.tsx` (NEW)

**Features**:
- Transformation selector (filter transformations suitable for summaries)
- Model selector (language models)
- Source/Note selection (which items to summarize)
- "Generate" button
- Show result in modal
- "Save as Note" button

**API Flow**:
1. User selects transformation and model
2. Call transformation API with notebook context
3. Display result
4. Optional: Save result as note

---

## 🔮 Task 5: Implement Transformation Runner (MEDIUM PRIORITY)

### 5.1 Create Transformation Dialog
**File**: `app/src/components/notebook/TransformationDialog.tsx` (NEW)

**Features**:
- Transformation selector (all transformations)
- Model selector
- Target selection:
  - Single source
  - Single note
  - Multiple sources
  - Entire notebook
- Input text (if manual input mode)
- "Run" button
- Result display
- "Save as Note" or "Save as Insight" buttons

**UI**:
```tsx
┌────────────────────────────────────────────┐
│ 🔮 Run Transformation             [✕]     │
├────────────────────────────────────────────┤
│                                            │
│ Transformation                             │
│ ┌────────────────────────────────────────┐ │
│ │ Select transformation...            ▼│ │
│ └────────────────────────────────────────┘ │
│ Description: Extracts key insights...      │
│                                            │
│ Model                                      │
│ ┌────────────────────────────────────────┐ │
│ │ gpt-4-turbo                          ▼│ │
│ └────────────────────────────────────────┘ │
│                                            │
│ Target                                     │
│ ( ) Selected Source: "Research Paper.pdf" │
│ ( ) Selected Note: "Meeting Notes"        │
│ ( ) All Sources in Notebook               │
│ ( ) Custom Text                            │
│                                            │
│ [Cancel]                      [Run →]     │
└────────────────────────────────────────────┘
```

---

## 📦 Task 6: Create Generated Items Display (MEDIUM PRIORITY)

### 6.1 Create GeneratedItemsList Component
**File**: `app/src/components/notebook/GeneratedItemsList.tsx` (NEW)

**Features**:
- Tabbed interface: Podcasts | Insights | AI Notes
- Each tab shows relevant items
- Empty states for each tab
- Actions on each item (view, delete, save, etc.)

**Tabs**:

#### Podcasts Tab
- Uses `PodcastEpisodesList` component (already created)

#### Insights Tab
- Fetch all source insights: Loop through sources → `getSourceInsights()`
- Display insight cards with:
  - Source name
  - Insight type
  - Content preview
  - "View" button → opens ReferenceModal
  - "Save as Note" button
  - "Delete" button

#### AI Notes Tab
- Fetch notes with filter: `getNotes({ notebook_id, note_type: 'ai' })`
- Display note cards (similar to NoteCard)
- Click to open NoteDetailModal

---

## ✨ Task 7: Polish & Improvements (POLISH PRIORITY)

### 7.1 Add Markdown Rendering
**File**: Install `react-markdown` and `remark-gfm`

```bash
npm install react-markdown remark-gfm rehype-highlight
```

**Create Component**: `app/src/components/shared/MarkdownRenderer.tsx`

**Use In**:
- Note previews
- AI response display
- Content previews
- Summary displays

---

### 7.2 Performance Optimizations

**1. Add React.memo to Cards**
```typescript
export const SourceCard = React.memo(({ source, onUpdate }: SourceCardProps) => {
  // ...
});
```

**2. Debounce Search Input** (already done)

**3. Virtual Scrolling for Long Lists**
Install `react-window` for large lists:
```bash
npm install react-window
```

**4. Code Splitting**
Use dynamic imports for heavy components:
```typescript
const PodcastGenerationDialog = dynamic(() => import('./PodcastGenerationDialog'));
```

---

### 7.3 Accessibility Improvements

**1. Add ARIA labels**
```tsx
<button aria-label="Delete source" onClick={handleDelete}>
  <Trash2 />
</button>
```

**2. Keyboard Navigation**
- Ensure all interactive elements are keyboard accessible
- Add focus styles
- Implement keyboard shortcuts (document them)

**3. Screen Reader Support**
- Add proper heading hierarchy
- Use semantic HTML
- Add alt text for icons

---

### 7.4 Mobile Responsiveness

**1. Three-Column Layout → Stacked on Mobile**
Already responsive, but refine:
- Left column (sources/notes) at top
- Middle column (search/chat) in middle
- Right column (generations) at bottom
- Use tabs on mobile to switch between columns

**2. Touch-Friendly Targets**
- Increase button sizes on mobile (min 44x44px)
- Add touch gestures (swipe to delete, etc.)

**3. Modal Sizing**
- Full screen modals on mobile
- Bottom sheet style for dialogs

---

## 📅 Implementation Timeline

### Week 1: Refactoring & Chat
- [ ] Day 1-2: Create shared components (BaseModal, BaseCard, ScrollableList)
- [ ] Day 3-4: Create shared hooks (useNotebook, useSources, useNotes, useModels)
- [ ] Day 5-7: Convert Ask to Chat (backend check, API updates, UI refactor)

### Week 2: Generations Setup
- [ ] Day 1-2: Create PodcastGenerationDialog with polling
- [ ] Day 3-4: Create PodcastEpisodesList with audio player
- [ ] Day 5-7: Create SummaryDialog and TransformationDialog

### Week 3: Generated Items & Polish
- [ ] Day 1-2: Create GeneratedItemsList with tabs
- [ ] Day 3-4: Add markdown rendering throughout
- [ ] Day 5-7: Performance optimizations and bug fixes

### Week 4: Testing & Documentation
- [ ] Day 1-2: Manual testing of all features
- [ ] Day 3-4: Write automated tests (unit + integration)
- [ ] Day 5-7: Update documentation, create user guide

---

## 🎯 Success Criteria

### Phase 4 Complete When:
- ✅ Chat feature works with persistent conversations
- ✅ All common components refactored and DRY
- ✅ Podcast generation workflow complete (create + display)
- ✅ Summary generation works
- ✅ Transformation runner works
- ✅ Generated items display in organized tabs
- ✅ Markdown rendering works throughout
- ✅ Application is performant (no lag on interactions)
- ✅ Mobile responsive (usable on phone/tablet)
- ✅ Accessibility score > 90 (Lighthouse)

---

## 📝 Notes

### Breaking Changes
- Renaming `AskPanel` to `ChatPanel` will require:
  - File rename
  - Import updates in MiddleColumn
  - Update exports in index.ts
  - Update any documentation references

### Dependencies to Add
```json
{
  "react-markdown": "^9.0.0",
  "remark-gfm": "^4.0.0",
  "rehype-highlight": "^7.0.0",
  "react-window": "^1.8.10"
}
```

### Backend Dependencies
Chat feature requires backend support for:
- Conversation storage
- Message threading
- Message editing/deletion

**Action Required**: Verify with backend team or check existing API endpoints.

---

## 🚀 Let's Get Started!

Once approved, we'll begin with **Task 1: Refactoring** to establish clean patterns, then move to **Task 2: Chat Conversion**, and finally **Task 3-6: Generations**.

Ready to build Phase 4? 🎉
