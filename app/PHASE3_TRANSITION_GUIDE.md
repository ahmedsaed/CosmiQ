# Phase 3 → Phase 4 Transition Guide 🚀

**Quick Reference for Developers**

---

## 📊 What We Have (Phase 3 ✅)

### Components Built (100% Functional)
```
app/src/components/notebook/
├── SearchPanel.tsx          ✅ 434 lines - Text/vector search
├── AskPanel.tsx             ✅ 552 lines - AI Q&A with streaming
├── ReferenceModal.tsx       ✅ 253 lines - View referenced content
├── SourceDetailModal.tsx    ✅ 441 lines - Manage sources & insights
├── NoteDetailModal.tsx      ✅ 280 lines - Edit notes with tabs
├── SourceCard.tsx           ✅ 138 lines - Interactive source cards
├── NoteCard.tsx             ✅ 121 lines - Interactive note cards
├── LeftColumn.tsx           ✅ Sources & Notes lists
├── MiddleColumn.tsx         ✅ Search & Ask panels
└── RightColumn.tsx          ⏸️  Stubs only
```

### API Integration (100% Complete)
```typescript
// app/src/lib/api-client.ts - All methods ready

✅ searchNotebook(notebookId, query, searchType)
✅ askStream(notebookId, question, models, callbacks)
✅ getSource(sourceId)
✅ getNote(noteId)
✅ getSourceInsights(sourceId)
✅ createSourceInsight(sourceId, transformationId)
✅ getTransformations()
✅ getModels(type)
✅ updateSource/Note(id, data)
✅ deleteSource/Note(id)
⏸️  generatePodcast() - Ready but unused
⏸️  getPodcastEpisodes() - Ready but unused
⏸️  getPodcastJobStatus() - Ready but unused
```

### Key Features Working
- ✅ **Search**: Text and vector modes with results
- ✅ **Ask**: Streaming AI responses with 3 model selectors
- ✅ **References**: Clickable `[source:id]`, `[note:id]` links
- ✅ **Modals**: React portals for proper centering
- ✅ **CRUD**: Full source and note management
- ✅ **Insights**: View, generate, save transformations

---

## 🎯 What We're Building (Phase 4 🚧)

### Phase 4 Goals
1. **Chat Conversion**: Ask → persistent Chat with history
2. **Refactoring**: DRY up components, create shared base
3. **Generations**: Complete podcast/summary/transformation workflow
4. **Polish**: Markdown, performance, accessibility

### Priority Order
```
Week 1: Refactoring + Chat
  └─ Shared components (BaseModal, BaseCard, hooks)
  └─ Convert Ask to Chat

Week 2: Generations
  └─ Podcast generation dialog + episodes list
  └─ Summary and transformation dialogs

Week 3: Display + Polish
  └─ Generated items display (tabs)
  └─ Markdown rendering
  └─ Performance optimizations

Week 4: Testing + Docs
  └─ Manual + automated testing
  └─ Update documentation
```

---

## 📁 New Files to Create

### Shared Components (Week 1)
```
app/src/components/shared/
├── BaseModal.tsx           🆕 Portal-based modal wrapper
├── BaseCard.tsx            🆕 Hover-enabled card base
├── ScrollableList.tsx      🆕 Reusable list container
└── MarkdownRenderer.tsx    🆕 Markdown with syntax highlight (Week 3)
```

### Hooks (Week 1)
```
app/src/hooks/
├── useNotebook.ts          🆕 Notebook state management
├── useSources.ts           🆕 Sources CRUD
├── useNotes.ts             🆕 Notes CRUD
├── useModels.ts            🆕 Models fetching/caching
└── useToast.ts             🆕 Toast notifications
```

### Generation Components (Week 2)
```
app/src/components/notebook/
├── ChatPanel.tsx                    🔄 Renamed from AskPanel
├── ConversationSelector.tsx         🆕 Chat thread selector
├── PodcastGenerationDialog.tsx      🆕 Podcast creation dialog
├── PodcastEpisodesList.tsx          🆕 Episodes with audio player
├── SummaryDialog.tsx                🆕 Summary generation
├── TransformationDialog.tsx         🆕 Transformation runner
└── GeneratedItemsList.tsx           🆕 Tabbed display
```

---

## 🔄 Files to Refactor

### High Priority Refactors
```typescript
// 1. SourceDetailModal.tsx
// Current: 441 lines with custom modal
// After: Use BaseModal, reduce to ~300 lines

// 2. NoteDetailModal.tsx  
// Current: 280 lines with custom modal
// After: Use BaseModal, reduce to ~200 lines

// 3. LeftColumn.tsx
// Current: Manual list rendering
// After: Use ScrollableList + hooks

// 4. SourceCard.tsx & NoteCard.tsx
// Current: Duplicate hover/click logic
// After: Extend BaseCard
```

---

## 🛠️ Refactoring Patterns

### Before (Current Pattern)
```typescript
// SourceDetailModal.tsx (simplified)
export function SourceDetailModal({ sourceId, isOpen, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<Source | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-50...">
        <Loader2 className="animate-spin" />
      </div>,
      document.body
    );
  }

  const modalContent = (
    <div className="fixed inset-0 z-50..." onClick={onClose}>
      <div className="glass-card..." onClick={(e) => e.stopPropagation()}>
        {/* Content */}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
```

### After (With BaseModal)
```typescript
// SourceDetailModal.tsx (refactored)
import { BaseModal } from '@/components/shared/BaseModal';

export function SourceDetailModal({ sourceId, isOpen, onClose }: Props) {
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && sourceId) {
      fetchSource();
    }
  }, [isOpen, sourceId]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={source?.title || 'Source Details'}
      size="xl"
      loading={loading}
    >
      {/* Content only - no portal/backdrop/close logic needed */}
      <Tabs>...</Tabs>
    </BaseModal>
  );
}
```

**Lines saved**: ~100+ lines of boilerplate per modal

---

## 🎨 Shared Component Examples

### BaseModal Usage
```typescript
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  title="Add Source"
  size="lg"
  showCloseButton={true}
  footer={
    <>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </>
  }
>
  <FormContent />
</BaseModal>
```

### BaseCard Usage
```typescript
<BaseCard
  icon={<FileText />}
  badge={<Badge variant="success">PDF</Badge>}
  title="Research Paper"
  subtitle="Added 2 days ago"
  preview="This paper discusses..."
  onClick={() => setShowModal(true)}
  onMenuClick={(e) => {
    e.stopPropagation();
    setShowMenu(true);
  }}
/>
```

### ScrollableList Usage
```typescript
<ScrollableList
  items={sources}
  renderItem={(source) => (
    <SourceCard
      key={source.id}
      source={source}
      onClick={() => handleSourceClick(source)}
    />
  )}
  emptyState={<EmptyState message="No sources yet" icon={<Inbox />} />}
  loading={loading}
  maxHeight="calc(100vh - 300px)"
/>
```

---

## 🔌 API Endpoints Reference

### Already Integrated ✅
```
POST   /api/search                     - Text/vector search
POST   /api/search/ask                 - Streaming AI Q&A
GET    /api/sources/{id}               - Get source
GET    /api/notes/{id}                 - Get note
GET    /api/sources/{id}/insights      - Get insights
POST   /api/sources/{id}/insights      - Create insight
PUT    /api/sources/{id}               - Update source
DELETE /api/sources/{id}               - Delete source
PUT    /api/notes/{id}                 - Update note
DELETE /api/notes/{id}                 - Delete note
GET    /api/transformations            - List transformations
GET    /api/models?type=language       - Get models
```

### Ready to Use (Phase 4) ⏸️
```
POST   /api/podcasts                   - Generate podcast
GET    /api/podcasts/jobs/{id}         - Job status
GET    /api/podcasts/episodes          - List episodes
DELETE /api/podcasts/episodes/{id}     - Delete episode
GET    /api/episode-profiles           - List profiles
GET    /api/speaker-profiles           - List profiles
```

### May Need Backend Work ❓
```
GET    /api/notebooks/{id}/conversations     - List chat threads
POST   /api/notebooks/{id}/conversations     - Create thread
GET    /api/conversations/{id}/messages      - Get messages
POST   /api/conversations/{id}/messages      - Add message
PUT    /api/conversations/{id}/messages/{id} - Edit message
DELETE /api/conversations/{id}/messages/{id} - Delete message
```

**Action**: Verify these exist before starting Chat conversion

---

## 📝 Code Patterns Established

### 1. React Portals for Modals
```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) return null;

const modalContent = (...);
return createPortal(modalContent, document.body);
```

### 2. Reference Parsing
```typescript
const refRegex = /\[([^\]]+)\]/g;
const matches = answer.match(refRegex);
const refs = matches.map(m => m.slice(1, -1).split(',').map(r => r.trim()));
// Fetch names with apiClient.getSource/getNote
```

### 3. Streaming SSE
```typescript
apiClient.askStream(
  notebookId,
  question,
  models,
  (chunk) => setAnswer(prev => prev + chunk),    // onChunk
  (final) => { /* save to history */ },          // onComplete
  (error) => { /* show toast */ }                // onError
);
```

### 4. Optimistic Updates
```typescript
const handleUpdate = (updated: Source) => {
  setSources(sources.map(s => s.id === updated.id ? updated : s));
};
```

### 5. Loading States
```typescript
const [loading, setLoading] = useState(true);

if (loading) return <LoadingSpinner />;
if (!data) return <EmptyState />;

return <DataDisplay data={data} />;
```

---

## 🚨 Common Pitfalls to Avoid

### ❌ Don't
```typescript
// Don't await StreamingResponse generator
await StreamingResponse(async_generator())

// Don't use f-strings for SSE
yield f"data: {{'chunk': '{text}'}}\n\n"

// Don't render modals inside constrained containers
<div className="w-64"> <Modal /> </div>

// Don't forget to check mounted for portals
return createPortal(...) // Wrong! SSR issues

// Don't show "Unknown" for missing data
<span>{reference?.name || "Unknown"}</span>
```

### ✅ Do
```typescript
// Do pass generator directly
StreamingResponse(async_generator())

// Do use json.dumps for SSE
yield f"data: {json.dumps({'chunk': text})}\n\n"

// Do use portals for modals
createPortal(<Modal />, document.body)

// Do check mounted state
if (!mounted) return null;
return createPortal(...)

// Do provide meaningful fallbacks
<span>{reference?.name || reference?.content?.slice(0, 30) + '...'}</span>
```

---

## 🎯 Testing Checklist

### Before Committing
- [ ] TypeScript compiles with no errors
- [ ] All existing features still work
- [ ] No console errors in browser
- [ ] Modal centering works properly
- [ ] Search returns results
- [ ] Ask streams responses correctly
- [ ] References are clickable and open modals
- [ ] Source/Note modals open with all tabs working
- [ ] Mobile responsive (test at 375px width)

### Manual Test Scenarios
1. **Search Flow**: Enter query → See results → Click result → View detail
2. **Ask Flow**: Ask question → Stream response → Click reference → See content
3. **Source Flow**: Click source → View insights → Run transformation → Edit title → Delete
4. **Note Flow**: Click note → Switch to edit tab → Make changes → Save → Delete
5. **CRUD Flow**: Add source → Add note → Edit both → Delete both

---

## 📚 Documentation Updated

- ✅ `PHASE3_COMPLETE_SUMMARY.md` - Complete feature summary
- ✅ `PHASE4_PLAN.md` - Detailed implementation plan
- ✅ `ARCHITECTURE.md` - Updated component status
- ✅ `PHASE3_TRANSITION_GUIDE.md` - This file (quick ref)
- ⏸️ Need to update: `README.md` with Phase 3 features
- ⏸️ Need to create: User guide for Chat feature

---

## 🚀 Next Steps

### Immediate Actions
1. **Review Phase 4 Plan**: Read `PHASE4_PLAN.md` thoroughly
2. **Approve Scope**: Confirm tasks and priorities
3. **Check Backend**: Verify conversation API endpoints exist
4. **Start Week 1**: Create shared components and hooks

### First Task
**Create BaseModal Component**
- File: `app/src/components/shared/BaseModal.tsx`
- Copy portal pattern from existing modals
- Add props for size, title, footer, loading
- Test with one existing modal (ReferenceModal)
- Refactor all modals to use it

---

**Ready to start Phase 4?** Let's build! 🎉
