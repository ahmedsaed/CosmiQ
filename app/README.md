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

### Phase 1: Foundation ✅
- [x] Next.js project setup
- [x] Tailwind CSS with dark space theme
- [x] API client with Bearer auth
- [x] TypeScript types for all API models
- [x] Base UI components (Button, Card, Input, Textarea)
- [ ] AppShell layout with Header
- [ ] Additional UI components

### Phase 2: Dashboard (In Progress)
- [ ] Notebooks list page
- [ ] Notebook cards
- [ ] Create notebook dialog
- [ ] Archive/delete functionality

### Phase 3: Notebook Detail
- [ ] Three-column layout
- [ ] Sources and notes management
- [ ] Search and Ask panels
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

