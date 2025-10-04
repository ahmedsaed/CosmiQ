# CosmiQ Frontend

Next.js frontend for CosmiQ - An open source, privacy-focused AI research assistant.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: 18
- **Styling**: Tailwind CSS with custom dark space theme
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- The CosmiQ API running on `http://localhost:5055`

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local and set your API URL and password (if needed)
```

### Development

```bash
# Run development server
npm run dev

# Build for production
npm build

# Start production server
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5055
NEXT_PUBLIC_API_PASSWORD=          # Optional - set if backend has password auth
NEXT_PUBLIC_APP_NAME=CosmiQ
```

## Project Structure

```
app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home/Dashboard
│   │   ├── notebook/           # Notebook pages
│   │   └── settings/           # Settings pages
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   └── ...                 # Feature components
│   ├── lib/                    # Utilities
│   │   ├── api-client.ts       # API client with auth
│   │   └── utils.ts            # Helper functions
│   └── types/                  # TypeScript types
│       └── api.ts              # API types matching backend
├── public/                     # Static assets
└── package.json
```

## Development Status

### Phase 1: Foundation ✅ COMPLETE
- ✅ Next.js 15 project setup with App Router
- ✅ Tailwind CSS with custom dark space theme
- ✅ API client with Bearer auth
- ✅ TypeScript types for all API models
- ✅ Base UI components (Button, Card, Input, Textarea, Modal)
- ✅ Shared components (BaseCard, BaseModal)
- ✅ Toast notification system
- ✅ Loading states and error handling

### Phase 2: Dashboard ✅ COMPLETE
- ✅ Notebooks list page with grid layout
- ✅ Notebook cards with hover effects
- ✅ Create notebook dialog
- ✅ Archive/restore functionality
- ✅ Delete with confirmation
- ✅ Empty states
- ✅ Search and filters
- ✅ Responsive design

### Phase 3: Notebook Detail Page ✅ COMPLETE
- ✅ Three-column responsive layout
- ✅ **Left Column**: Sources & Notes management
  - ✅ Add/delete sources (file, URL, text, YouTube)
  - ✅ Add/delete notes
  - ✅ Source and note detail modals
  - ✅ Scrollable lists with counters
- ✅ **Middle Column**: Chat & Search
  - ✅ **Chat Panel**: AI conversations with streaming responses
  - ✅ **Search Panel**: Text and vector search with clickable results
  - ✅ Reference parsing and modal integration
  - ✅ Export answers as notes
- ✅ **Right Column**: Generations (Tabbed)
  - ✅ **Generations Tab**: Apply transformations, generate insights
  - ✅ **Podcasts Tab**: Generate audio episodes from content
  - ✅ Status tracking and downloads
  - ✅ Scrollable containers
- ✅ Notebook header with inline editing
- ✅ Full API integration
- ✅ Toast notifications for all actions

### Phase 4: Settings & Polish (Next)
- [ ] Settings page with tabs
- [ ] Model management (add/edit/delete)
- [ ] Transformation type management
- [ ] Podcast profile configuration
- [ ] System settings
- [ ] Performance optimizations
- [ ] Additional UI polish

## Key Features

### 🤖 AI Chat
- Real-time streaming responses
- Clickable references to sources and notes
- Model auto-loading from backend
- Export answers as notes
- Message history

### 🔍 Search
- **Text Search**: Exact keyword matching with highlighting
- **Vector Search**: Semantic similarity with scores
- Search across sources and notes
- Clickable results open detail modals

### ✨ Generations
- Apply transformation types to sources
- Generate insights using AI models
- View, save, and manage insights
- Batch processing support

### 🎙️ Podcasts
- Generate audio episodes from notebook content
- Configure episode and speaker profiles
- Track generation status
- Download completed episodes

### 📚 Content Management
- Multiple source types (files, URLs, text, YouTube)
- Human and AI notes
- Full-text search and embeddings
- Organize by notebooks
- [ ] Generations panel

### Phase 4: Settings
- [ ] General settings
- [ ] Models management
- [ ] Transformations
- [ ] Podcasts

## Contributing

This is a custom fork of Open Notebook. See the main project for contribution guidelines.

## License

MIT License - see LICENSE file in the root directory.

