# Phase 4: High Priority Tasks - Actionable Plan 🎯

**Date**: October 4, 2025  
**Focus**: Settings Page, Component Refactoring, and Code Quality

---

## 🎯 Overview

Based on Phase 3 completion and current backend capabilities, Phase 4 will focus on:

1. ✅ **Settings Page** - Complete system configuration UI
2. ✅ **Component Refactoring** - Extract reusable patterns
3. ✅ **Code Quality** - Shared utilities and hooks

**Note**: Chat persistence requires backend API endpoints that don't exist yet. We'll enhance the current chat instead.

---

## 📋 Task Breakdown

### Task 1: Settings Page (HIGH PRIORITY) 🔥

**Goal**: Create a comprehensive settings interface for all system configuration.

**Location**: `/app/settings/page.tsx` (new)

#### 1.1 Settings Page Structure

**Tab Layout**:
```
┌─────────────────────────────────────────────────┐
│  ⚙️  Settings                                    │
├─────────────────────────────────────────────────┤
│  [Models] [Transformations] [Podcasts] [System] │
├─────────────────────────────────────────────────┤
│                                                  │
│  Tab Content Area                                │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### 1.2 Models Tab

**Features**:
- ✅ List all configured models
- ✅ Add new model (provider, name, API key, base URL)
- ✅ Edit existing model
- ✅ Delete model (with confirmation)
- ✅ Test model connection
- ✅ Set default models for strategy/answer/final answer
- ✅ Model type indicators (LLM, Embedding, etc.)

**API Endpoints** (check if exist):
- `GET /api/models` ✅
- `POST /api/models` ✅
- `PUT /api/models/{id}` ✅
- `DELETE /api/models/{id}` ✅
- `POST /api/models/{id}/test` (may need to add)

**UI Components**:
- `ModelsTab.tsx`
- `AddModelDialog.tsx`
- `EditModelDialog.tsx`
- `ModelCard.tsx`

#### 1.3 Transformations Tab

**Features**:
- ✅ List all transformation types
- ✅ Create new transformation
  - Name
  - Description
  - Prompt template
  - Apply by default checkbox
- ✅ Edit transformation
- ✅ Delete transformation (with confirmation)
- ✅ Preview transformation prompt

**API Endpoints** (check if exist):
- `GET /api/transformations` ✅
- `POST /api/transformations` ✅
- `PUT /api/transformations/{id}` ✅
- `DELETE /api/transformations/{id}` ✅

**UI Components**:
- `TransformationsTab.tsx`
- `AddTransformationDialog.tsx`
- `EditTransformationDialog.tsx`
- `TransformationCard.tsx`

#### 1.4 Podcasts Tab

**Features**:
- ✅ **Episode Profiles** section
  - List episode profiles
  - Add/edit/delete episode profiles
  - Configure conversation style, structure, length
- ✅ **Speaker Profiles** section
  - List speaker profiles
  - Add/edit/delete speaker profiles
  - Configure voice characteristics

**API Endpoints** (check if exist):
- `GET /api/episode-profiles` ✅
- `POST /api/episode-profiles` ✅
- `PUT /api/episode-profiles/{id}` ✅
- `DELETE /api/episode-profiles/{id}` ✅
- `GET /api/speaker-profiles` ✅
- `POST /api/speaker-profiles` ✅
- `PUT /api/speaker-profiles/{id}` ✅
- `DELETE /api/speaker-profiles/{id}` ✅

**UI Components**:
- `PodcastsTab.tsx`
- `EpisodeProfileCard.tsx`
- `SpeakerProfileCard.tsx`
- `AddEpisodeProfileDialog.tsx`
- `AddSpeakerProfileDialog.tsx`

#### 1.5 System Tab

**Features**:
- ✅ Database connection info
- ✅ API version
- ✅ Cache settings
- ✅ Export/import configuration
- ✅ Clear cache/reset options

**API Endpoints** (check if exist):
- `GET /api/settings/info` (system info)
- `POST /api/settings/cache/clear` (if exists)

**UI Components**:
- `SystemTab.tsx`

---

### Task 2: Component Refactoring (HIGH PRIORITY) 🔥

**Goal**: Extract common patterns to reduce code duplication and improve maintainability.

#### 2.1 Create Shared List Component

**File**: `app/src/components/shared/ItemsList.tsx` (NEW)

**Purpose**: Reusable scrollable list with empty states

**Props**:
```typescript
interface ItemsListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  loading?: boolean;
  maxHeight?: string; // e.g., "400px", "600px"
}
```

**Usage**:
```tsx
<ItemsList
  items={sources}
  renderItem={(source) => <SourceCard source={source} />}
  emptyIcon="📄"
  emptyTitle="No sources yet"
  emptyDescription="Add documents to get started"
  maxHeight="400px"
/>
```

**Replaces**:
- Source list in LeftColumn
- Note list in LeftColumn
- Insights list in TransformationsPanel
- Episodes list in PodcastsPanel
- Search results in SearchPanel

#### 2.2 Create Shared Form Dialog

**File**: `app/src/components/shared/FormDialog.tsx` (NEW)

**Purpose**: Reusable dialog with form structure

**Props**:
```typescript
interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void | Promise<void>;
  loading?: boolean;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
}
```

**Replaces**:
- AddSourceDialog
- AddNoteDialog
- Add model/transformation/profile dialogs

#### 2.3 Create Shared Action Menu

**File**: `app/src/components/shared/ActionMenu.tsx` (NEW)

**Purpose**: Three-dot menu with actions

**Props**:
```typescript
interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  position?: 'left' | 'right';
}
```

**Usage**:
```tsx
<ActionMenu
  items={[
    { label: 'Edit', icon: <Edit />, onClick: handleEdit },
    { label: 'Delete', icon: <Trash />, onClick: handleDelete, variant: 'danger' }
  ]}
/>
```

**Replaces**:
- Menu in BaseCard
- Custom menus in various components

#### 2.4 Enhanced BaseCard

**File**: Update `app/src/components/shared/BaseCard.tsx`

**Changes**:
- Add optional `badge` prop (for status indicators)
- Add optional `footer` prop (for additional info)
- Add `size` prop ('sm', 'md', 'lg')
- Better hover states
- Loading skeleton variant

---

### Task 3: Shared Hooks and Utilities (HIGH PRIORITY) 🔥

**Goal**: Extract common logic into reusable hooks.

#### 3.1 useConfirm Hook

**File**: `app/src/hooks/useConfirm.tsx` (NEW)

**Purpose**: Reusable confirmation dialogs

```typescript
const { confirm } = useConfirm();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Delete Item',
    message: 'Are you sure? This cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    variant: 'danger'
  });
  
  if (confirmed) {
    // Proceed with deletion
  }
};
```

**Replaces**:
- Native `window.confirm()` calls throughout app
- Custom confirmation dialogs

#### 3.2 useLocalStorage Hook

**File**: `app/src/hooks/useLocalStorage.tsx` (NEW)

**Purpose**: Persist state to localStorage

```typescript
const [value, setValue] = useLocalStorage('key', defaultValue);
```

**Use Cases**:
- Remember last selected models
- Remember search preferences
- Remember UI preferences (collapsed states, etc.)

#### 3.3 usePagination Hook

**File**: `app/src/hooks/usePagination.tsx` (NEW)

**Purpose**: Handle pagination logic

```typescript
const { page, pageSize, totalPages, nextPage, prevPage, goToPage } = usePagination({
  totalItems: items.length,
  pageSize: 20
});
```

**Use Cases**:
- Large lists (future optimization)
- Search results
- Settings lists

#### 3.4 useDebounce Hook

**File**: `app/src/hooks/useDebounce.tsx` (NEW)

**Purpose**: Debounce input changes

```typescript
const debouncedSearch = useDebounce(searchQuery, 500);

useEffect(() => {
  // Fetch results with debouncedSearch
}, [debouncedSearch]);
```

**Use Cases**:
- Search input
- Any real-time filtering

#### 3.5 API Helper Utilities

**File**: `app/src/lib/api-helpers.ts` (NEW)

**Functions**:
```typescript
// Batch operations
export async function batchDelete<T>(
  ids: string[],
  deleteFunc: (id: string) => Promise<void>,
  onProgress?: (completed: number, total: number) => void
): Promise<void>

// Retry logic
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T>

// Cache helper
export class ApiCache {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttl?: number): void
  clear(key?: string): void
}
```

---

## 🗓️ Implementation Schedule

### Week 1: Settings Page Foundation

**Day 1-2**: Project structure
- [ ] Create `/app/settings/page.tsx`
- [ ] Create settings layout with tabs
- [ ] Add navigation to settings from header

**Day 3-4**: Models Tab
- [ ] Implement ModelsTab component
- [ ] Add/Edit/Delete model dialogs
- [ ] Model cards with actions
- [ ] API integration

**Day 5-6**: Transformations Tab
- [ ] Implement TransformationsTab component
- [ ] Add/Edit/Delete transformation dialogs
- [ ] Transformation cards with actions
- [ ] API integration

**Day 7**: Testing & Polish
- [ ] Test all CRUD operations
- [ ] Error handling
- [ ] Loading states
- [ ] Toast notifications

### Week 2: Complete Settings + Refactoring

**Day 1-2**: Podcasts Tab
- [ ] Episode profiles section
- [ ] Speaker profiles section
- [ ] Add/Edit/Delete dialogs
- [ ] API integration

**Day 3**: System Tab
- [ ] System information display
- [ ] Cache management
- [ ] Settings export/import (if time)

**Day 4-5**: Component Refactoring
- [ ] Create ItemsList component
- [ ] Create FormDialog component
- [ ] Create ActionMenu component
- [ ] Update BaseCard

**Day 6-7**: Shared Hooks
- [ ] useConfirm hook
- [ ] useLocalStorage hook
- [ ] useDebounce hook
- [ ] API helpers

---

## 📁 New File Structure

```
app/src/
├── app/
│   ├── settings/
│   │   ├── page.tsx                    # Settings page with tabs
│   │   └── layout.tsx                  # Settings layout (optional)
│   └── ...
├── components/
│   ├── settings/                       # NEW
│   │   ├── ModelsTab.tsx
│   │   ├── TransformationsTab.tsx
│   │   ├── PodcastsTab.tsx
│   │   ├── SystemTab.tsx
│   │   ├── AddModelDialog.tsx
│   │   ├── EditModelDialog.tsx
│   │   ├── ModelCard.tsx
│   │   ├── AddTransformationDialog.tsx
│   │   ├── EditTransformationDialog.tsx
│   │   ├── TransformationCard.tsx
│   │   ├── EpisodeProfileCard.tsx
│   │   ├── SpeakerProfileCard.tsx
│   │   ├── AddEpisodeProfileDialog.tsx
│   │   └── AddSpeakerProfileDialog.tsx
│   ├── shared/
│   │   ├── ItemsList.tsx               # NEW: Reusable list
│   │   ├── FormDialog.tsx              # NEW: Reusable form dialog
│   │   ├── ActionMenu.tsx              # NEW: Three-dot menu
│   │   ├── BaseCard.tsx                # ENHANCED
│   │   └── BaseModal.tsx               # Existing
│   └── ...
├── hooks/                              # NEW
│   ├── useConfirm.tsx
│   ├── useLocalStorage.tsx
│   ├── usePagination.tsx
│   └── useDebounce.tsx
├── lib/
│   ├── api-client.ts                   # EXTEND
│   ├── api-helpers.ts                  # NEW
│   └── utils.ts                        # Existing
└── types/
    └── api.ts                          # EXTEND
```

---

## 🎯 Success Criteria

### Settings Page
- ✅ All CRUD operations work for models, transformations, profiles
- ✅ Proper error handling and loading states
- ✅ Toast notifications for all actions
- ✅ Responsive design
- ✅ Confirmation dialogs for destructive actions

### Component Refactoring
- ✅ At least 3 components refactored to use new shared components
- ✅ Reduced code duplication by 30%+
- ✅ Consistent UI patterns across the app

### Shared Hooks
- ✅ At least 3 hooks implemented and used in 2+ places
- ✅ Improved code readability
- ✅ Easier testing and maintenance

---

## 📊 Expected Impact

### Code Quality
- **Before**: 200+ lines per dialog component
- **After**: 50-80 lines using shared components
- **Reduction**: 60-70% code duplication eliminated

### Maintainability
- Single source of truth for common patterns
- Easier to update UI consistently
- Better type safety with shared interfaces

### Developer Experience
- Faster feature development
- Consistent component API
- Reusable hooks for common logic

---

## 🚀 Next Steps After Phase 4

1. **Phase 5**: Advanced features (batch operations, keyboard shortcuts)
2. **Phase 6**: Testing (unit tests, integration tests)
3. **Phase 7**: Performance optimization (virtual scrolling, code splitting)
4. **Phase 8**: Mobile app (React Native/Capacitor)

---

## 💡 Notes

### Chat Persistence
- Current chat works well for single sessions
- Backend doesn't have conversation API endpoints yet
- Can add in future phase when backend is ready
- Focus on settings and refactoring now for better foundation

### API Endpoint Verification
Before implementing each tab, verify endpoints exist:
```bash
# Check what's available
curl http://localhost:5055/docs
```

### Progressive Enhancement
- Start with basic CRUD operations
- Add advanced features incrementally
- Test each feature thoroughly before moving on

---

## ✅ Ready to Start!

Phase 4 is focused on:
1. **Settings Page** - Complete system configuration
2. **Refactoring** - Better code structure
3. **Utilities** - Shared hooks and helpers

This will create a solid foundation for future phases! 🎯

Let's begin with Task 1: Settings Page! 🚀
