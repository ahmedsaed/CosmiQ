# CosmiQ Frontend Architecture

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **React**: React 18
- **Styling**: Tailwind CSS 3.4+ with custom dark space theme
- **State Management**: React Context + hooks (for global state like auth, settings)
- **API Client**: Custom fetch wrapper with Bearer token auth
- **TypeScript**: Full type safety
- **Icons**: Lucide React (modern, consistent icon set)
- **Streaming**: EventSource API for SSE (ask/search streaming)

## Page Structure

### 1. Dashboard / Home (`/`)
**Route**: `/` or `/dashboard`

**Purpose**: Landing page showing all notebooks (active and archived)

**API Endpoints**:
- `GET /api/notebooks?order_by=updated desc`

**Components**:
- `NotebookGrid` - Grid/list view of notebooks
- `NotebookCard` - Individual notebook card with name, description, metadata
- `CreateNotebookDialog` - Modal for creating new notebook
- `NotebookArchiveSection` - Collapsible section for archived notebooks

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Header: CosmiQ Logo | Search | Settings Icon           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  "My Notebooks"                      │
│  │  + Create    │                                       │
│  └──────────────┘                                       │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Notebook │  │ Notebook │  │ Notebook │             │
│  │   Card   │  │   Card   │  │   Card   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  📦 Archived (3) [collapsible]                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Create new notebook
- Open notebook (navigate to notebook page)
- Archive/unarchive notebook
- Delete notebook
- Sort by updated/created date
- Search/filter notebooks (client-side)

---

### 2. Notebook/Project Page (`/notebook/[id]`)
**Route**: `/notebook/[id]`

**Purpose**: Main workspace for a notebook - three-column layout with sources, chat/search, and generations

**API Endpoints**:
- `GET /api/notebooks/{id}`
- `GET /api/sources?notebook_id={id}`
- `GET /api/notes?notebook_id={id}`
- `POST /api/search` (text/vector search)
- `POST /api/search/ask` (streaming ask)
- `POST /api/search/ask/simple` (non-streaming fallback)
- `GET /api/models/defaults`
- `POST /api/sources`
- `POST /api/notes`
- `POST /api/sources/{id}/insights`
- `GET /api/sources/{id}/insights`
- `GET /api/notebooks/{id}/context`

**Layout** (3-column responsive):
```
┌──────────────────────────────────────────────────────────────────┐
│ Header: ← Back | Notebook Name | Archive | Delete | Refresh     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────┐  ┌──────────────────────┐  ┌──────────────────┐    │
│ │ Left    │  │ Middle               │  │ Right            │    │
│ │ Column  │  │ Column               │  │ Column           │    │
│ │         │  │                      │  │                  │    │
│ │ + Add   │  │ 🔍 Search/Ask        │  │ ⚡ Generations   │    │
│ │ Source  │  │                      │  │                  │    │
│ │         │  │ ┌──────────────────┐ │  │ + Generate       │    │
│ │ + Add   │  │ │ Search Input     │ │  │   Podcast        │    │
│ │ Note    │  │ └──────────────────┘ │  │                  │    │
│ │         │  │                      │  │ + Create         │    │
│ │ ───────│  │ ┌──────────────────┐ │  │   Summary        │    │
│ │         │  │ │ Ask Input        │ │  │                  │    │
│ │ 📄 Src 1│  │ └──────────────────┘ │  │ + Run            │    │
│ │ 📄 Src 2│  │                      │  │   Transform      │    │
│ │         │  │ 💬 Chat History     │  │                  │    │
│ │ ───────│  │                      │  │ ───────────────  │    │
│ │         │  │ ┌──────────────────┐ │  │                  │    │
│ │ 📝 Note1│  │ │ User: question   │ │  │ 🎙️ Podcast 1    │    │
│ │ 📝 Note2│  │ │ AI: answer...    │ │  │ 📊 Summary 1     │    │
│ │         │  │ └──────────────────┘ │  │ 🔮 Insight 1     │    │
│ └─────────┘  └──────────────────────┘  └──────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

**Left Column Components**:
- `AddSourceButton` + `AddSourceDialog` (upload file, URL, text)
- `AddNoteButton` + `AddNoteDialog`
- `SourcesList` (scrollable)
  - `SourceCard` (title, type icon, actions: view, delete, generate insight)
- `NotesList` (scrollable)
  - `NoteCard` (title, preview, actions: view, edit, delete)

**Middle Column Components**:
- `SearchPanel`
  - Search input
  - Search type toggle (text/vector)
  - Filters (search sources, search notes)
  - Results list with relevance scores
- `AskPanel`
  - Question input
  - Model selectors (strategy, answer, final answer)
  - Streaming answer display with progressive rendering
  - Save answer as note button
- `ChatHistory` (persistent chat within notebook context)

**Right Column Components**:
- `GenerationMenu`
  - `GeneratePodcastButton` → Opens podcast generation dialog
  - `CreateSummaryButton` → Runs transformation on notebook context
  - `RunTransformationMenu` → Select transformation + target (source/note)
- `GeneratedItemsList`
  - `PodcastCard` (title, duration, play/download, delete)
  - `InsightCard` (from transformations, title, content preview, save as note)
  - `SummaryCard` (generated summaries)

**Features**:
- Edit notebook name/description inline
- Add sources (file upload, URL, raw text)
- Add notes (manual, AI-generated)
- Search within notebook (text/vector)
- Ask questions with streaming responses
- Generate podcasts with episode profiles
- Run transformations on sources/notes
- View and manage generated content
- Real-time updates (optimistic UI)

---

### 3. Settings Page (`/settings`)
**Route**: `/settings`

**Purpose**: Unified settings page with sub-tabs/sections for models, transformations, podcasts, and app settings

**API Endpoints**:
- `GET/PUT /api/settings`
- `GET/POST/DELETE /api/models`
- `GET/PUT /api/models/defaults`
- `GET/POST/PUT/DELETE /api/transformations`
- `POST /api/transformations/execute`
- `GET/POST/PUT/DELETE /api/episode-profiles`
- `GET/POST/PUT/DELETE /api/speaker-profiles` (if exists)

**Layout** (tabbed interface):
```
┌──────────────────────────────────────────────────────────────┐
│ Header: ⚙️ Settings                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [ General ] [ Models ] [ Transformations ] [ Podcasts ]     │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│  Active Tab Content                                          │
│                                                              │
│  (See sub-sections below)                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 3.1 General Settings Tab
**Content**:
- Content processing engine for documents (auto/docling/simple)
- Content processing engine for URLs (auto/firecrawl/jina/simple)
- Default embedding option (ask/always/never)
- Auto-delete uploaded files (yes/no)
- YouTube preferred languages (multi-select)

**Components**:
- `SettingsForm` with dropdown selects and help text
- Save button with toast notification

#### 3.2 Models Tab
**Content**:
- Provider availability status
- Language models list (add, delete, set defaults)
- Embedding models list (add, delete, set default)
- Text-to-speech models list (add, delete, set default)
- Speech-to-text models list (add, delete, set default)
- Default model assignments for each category

**Components**:
- `ProviderStatus` - Shows available/unavailable providers
- `ModelTypeSection` - Grouped by model type
  - `ModelList` - List of configured models with delete action
  - `AddModelForm` - Provider + model name input
  - `DefaultModelSelector` - Dropdown for default assignment
- Help text and warnings for missing models

#### 3.3 Transformations Tab
**Content**:
- Default transformation prompt (global instructions)
- List of transformations (name, title, description, prompt)
- Add/edit/delete transformations
- Playground to test transformations

**Components**:
- `DefaultPromptEditor` - Large textarea for default prompt
- `TransformationList`
  - `TransformationCard` (name, description, edit/delete actions)
  - `TransformationEditor` (name, title, description, prompt fields)
- `TransformationPlayground`
  - Transformation selector
  - Model selector
  - Input text area
  - Run button
  - Output display

#### 3.4 Podcasts Tab
**Content**:
- Episode profiles management (CRUD)
- Speaker profiles management (CRUD)
- Configuration for speakers (voice IDs, backstory, personality)
- TTS provider/model selection per profile

**Components**:
- `EpisodeProfileList`
  - `EpisodeProfileCard` (name, description, speaker config, edit/delete)
  - `EpisodeProfileEditor` (all fields from Streamlit page)
- `SpeakerProfileList`
  - `SpeakerProfileCard` (name, speakers count, TTS config, edit/delete)
  - `SpeakerProfileEditor` (1-4 speakers with voice IDs, backstory, personality)
- Confirmation dialogs for deletes with usage warnings

---

## Shared Components

### Layout Components
- `AppShell` - Main layout wrapper with header and navigation
- `Header` - Top navigation with logo, search, settings link, user menu
- `Sidebar` (optional) - Collapsible side navigation for quick notebook access
- `PageHeader` - Reusable page title with breadcrumbs and actions

### UI Components
- `Button` - Primary, secondary, danger variants with icons
- `Card` - Container with border, padding, hover effects
- `Dialog` - Modal overlay for forms and confirmations
- `Input` / `Textarea` - Form inputs with validation
- `Select` / `MultiSelect` - Dropdown selectors
- `Toggle` / `Checkbox` - Boolean inputs
- `Badge` - Small label for status/tags
- `Toast` - Notification system
- `Loading` - Spinner and skeleton loaders
- `EmptyState` - Placeholder when no data
- `ConfirmDialog` - Generic confirmation modal

### Data Components
- `ModelSelector` - Dropdown for selecting AI models (filtered by type)
- `MarkdownRenderer` - Display markdown content with syntax highlighting
- `SourceCard` - Display source with icon, title, actions
- `NoteCard` - Display note with title, preview, actions
- `SearchResultCard` - Display search result with score and highlights
- `StreamingAnswer` - Progressive rendering of streaming AI responses

### Form Components
- `NotebookForm` - Create/edit notebook
- `SourceForm` - Add source (file/URL/text) with transformation options
- `NoteForm` - Create/edit note
- `PodcastGenerationForm` - Complex form for podcast generation
- `TransformationForm` - Create/edit transformation

---

## API Client Architecture

### `lib/api-client.ts`
Central API client with:
- Base URL configuration (from env: `NEXT_PUBLIC_API_URL` default `http://localhost:5055`)
- Bearer token authentication (from env: `NEXT_PUBLIC_API_PASSWORD`)
- Request/response interceptors
- Error handling with typed exceptions
- Typed methods for all endpoints

### Example structure:
```typescript
class APIClient {
  private baseURL: string;
  private headers: HeadersInit;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5055';
    const password = process.env.NEXT_PUBLIC_API_PASSWORD;
    this.headers = password ? { Authorization: `Bearer ${password}` } : {};
  }

  // Notebooks
  async getNotebooks(params?: { archived?: boolean; order_by?: string }): Promise<Notebook[]>
  async createNotebook(data: CreateNotebookData): Promise<Notebook>
  async getNotebook(id: string): Promise<Notebook>
  async updateNotebook(id: string, data: UpdateNotebookData): Promise<Notebook>
  async deleteNotebook(id: string): Promise<void>

  // Sources
  async getSources(params?: { notebook_id?: string }): Promise<Source[]>
  async createSource(data: CreateSourceData): Promise<Source>
  // ... etc

  // Search
  async search(data: SearchRequest): Promise<SearchResponse>
  async askSimple(data: AskRequest): Promise<AskResponse>
  async askStreaming(data: AskRequest): AsyncIterable<AskStreamChunk>

  // Models, Transformations, Settings, etc.
}

export const apiClient = new APIClient();
```

### TypeScript Types
`types/api.ts` - All API request/response types matching backend Pydantic models:
- `Notebook`, `CreateNotebookData`, `UpdateNotebookData`
- `Source`, `CreateSourceData`
- `Note`, `CreateNoteData`
- `Model`, `CreateModelData`, `DefaultModels`
- `Transformation`, `CreateTransformationData`
- `SearchRequest`, `SearchResponse`, `AskRequest`, `AskResponse`
- `Settings`, `UpdateSettingsData`
- `EpisodeProfile`, `SpeakerProfile`
- etc.

---

## Routing Structure

```
app/
├── layout.tsx              # Root layout with AppShell
├── page.tsx                # Dashboard (notebooks list)
├── notebook/
│   └── [id]/
│       └── page.tsx        # Notebook detail (3-column layout)
├── settings/
│   ├── page.tsx            # Settings (general tab)
│   ├── models/
│   │   └── page.tsx        # Models tab
│   ├── transformations/
│   │   └── page.tsx        # Transformations tab
│   └── podcasts/
│       └── page.tsx        # Podcasts tab
└── api/                    # (Optional) Next.js API routes if needed
```

---

## State Management

### Global State (React Context)
- `AuthContext` - Authentication state (optional password)
- `SettingsContext` - App settings (loaded once)
- `ModelsContext` - Default models (loaded once, cached)

### Local State (Component State)
- Notebook data (fetched per page)
- Search results
- Chat history
- Form states

### Server State (React Query / SWR - optional)
If we want caching/refetching:
- Use `@tanstack/react-query` or `swr` for data fetching
- Cache notebooks, sources, notes with automatic revalidation
- Optimistic updates for mutations

---

## Dark Space Theme Specification

### Color Palette
```css
:root {
  /* Background layers */
  --bg-space: #0a0e1a;           /* Deep space background */
  --bg-panel: #121828;            /* Panel background */
  --bg-card: #1a2035;             /* Card background */
  --bg-hover: #232d45;            /* Hover state */
  
  /* Accents */
  --accent-primary: #00d9ff;      /* Cyan/teal accent */
  --accent-secondary: #a855f7;    /* Purple accent */
  --accent-success: #10b981;      /* Green for success */
  --accent-warning: #f59e0b;      /* Orange for warnings */
  --accent-danger: #ef4444;       /* Red for errors */
  
  /* Text */
  --text-primary: #e5e7eb;        /* High contrast white */
  --text-secondary: #9ca3af;      /* Muted gray */
  --text-tertiary: #6b7280;       /* Subtle gray */
  
  /* Borders */
  --border-color: #2d3748;
  --border-focus: #00d9ff;
  
  /* Shadows & Glows */
  --glow-primary: 0 0 20px rgba(0, 217, 255, 0.3);
  --glow-secondary: 0 0 20px rgba(168, 85, 247, 0.3);
}
```

### Typography
- **Headings**: Inter or Geist Sans (modern, geometric)
- **Body**: Inter or System UI
- **Code/Mono**: JetBrains Mono or Fira Code (for model names, prompts)
- Font sizes: Base 16px, scale 1.25 ratio

### Visual Elements
- **Cards**: Subtle glass effect with `backdrop-blur`
- **Borders**: Thin borders with glow on hover/focus
- **Buttons**: Solid with accent colors, glow on hover
- **Inputs**: Dark with border, cyan glow on focus
- **Animations**: Smooth transitions (200-300ms), subtle pulse/glow effects
- **Background**: Optional animated star field or grid pattern (CSS/SVG)

### Component Examples
- Notebook cards: Glass card with hover lift and glow border
- Source/Note cards: Compact with icon, title, preview, action buttons
- Search results: Highlight matches, show relevance score badge
- Streaming answer: Progressive text reveal with typing indicator
- Model selector: Dropdown with provider badge and model name in mono font

---

## Development Plan

### Phase 1: Setup & Foundation ✅
1. ✅ Initialize Next.js 15 project with App Router
2. ✅ Setup Tailwind CSS with custom theme config
3. ✅ Create API client with authentication
4. ✅ Define TypeScript types for all API models
5. ✅ Build shared UI components (Button, Card, Dialog, Input, etc.)
6. ✅ Create AppShell layout with Header

### Phase 2: Dashboard ✅
1. ✅ Implement notebooks list page
2. ✅ NotebookCard component
3. ✅ CreateNotebookDialog
4. ✅ Archive/delete functionality

### Phase 3: Notebook Detail Page (Core)
1. Three-column layout (responsive)
2. Left: Sources and Notes lists with add dialogs
3. Middle: Search panel with results
4. Middle: Ask panel with streaming responses
5. Right: Generation menu (stubs for now)
6. Right: Generated items list

### Phase 4: Settings Pages
1. General settings tab with form
2. Models management tab (list, add, delete, defaults)
3. Transformations tab (list, editor, playground)
4. Podcasts tab (episode/speaker profiles management)

### Phase 5: Polish & Testing
1. Error handling and loading states
2. Responsive design for mobile/tablet
3. Accessibility (keyboard nav, ARIA labels)
4. Performance optimization
5. Theme refinements (animations, glows)

---

## Environment Variables

### Required for Frontend
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5055
NEXT_PUBLIC_API_PASSWORD=optional_password_here

# Optional
NEXT_PUBLIC_APP_NAME=CosmiQ
```

### Backend remains unchanged
All existing backend env vars (OpenAI keys, SurrealDB config, etc.) stay as-is.

---

## Notes

1. **No Streamlit changes**: The existing Streamlit app (`pages/`) remains untouched. It continues to work on port 8502.

2. **API-first approach**: The frontend is purely a client to the existing API. No backend modifications needed.

3. **Progressive enhancement**: We'll start with core features (notebooks, search/ask) and progressively add podcast generation, transformations, etc.

4. **Responsive design**: Three-column layout collapses to stacked layout on mobile (left → middle → right becomes vertical).

5. **Real-time features**: Consider WebSocket or SSE for live updates if multiple users access the same notebook (future enhancement).

6. **Deployment**: Next.js app can be:
   - Served from the same Docker container (add to supervisord)
   - Deployed separately (Vercel, Netlify) pointing to the API
   - Static export for self-hosting

---

This architecture provides a modern, scalable foundation for the CosmiQ frontend while maintaining full compatibility with the existing backend API. Ready to start implementation after your approval! 🚀
