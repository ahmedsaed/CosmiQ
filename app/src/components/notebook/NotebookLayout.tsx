'use client';

import { Source, Note } from '@/types/api';
import { LeftColumn } from './LeftColumn';
import { MiddleColumn } from './MiddleColumn';
import { RightColumn } from './RightColumn';

interface NotebookLayoutProps {
  notebookId: string;
  sources: Source[];
  setSources: (sources: Source[]) => void;
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  onRefresh: () => void;
}

export function NotebookLayout({
  notebookId,
  sources,
  setSources,
  notes,
  setNotes,
  onRefresh,
}: NotebookLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Desktop: 3 columns, Tablet: 2 columns (middle takes precedence), Mobile: 1 column stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Sources & Notes */}
        <div className="lg:col-span-3 order-1">
          <LeftColumn
            notebookId={notebookId}
            sources={sources}
            setSources={setSources}
            notes={notes}
            setNotes={setNotes}
          />
        </div>

        {/* Middle Column - Search & Ask */}
        <div className="lg:col-span-6 order-2">
          <MiddleColumn
            notebookId={notebookId}
            sources={sources}
            notes={notes}
          />
        </div>

        {/* Right Column - Generations */}
        <div className="lg:col-span-3 order-3">
          <RightColumn notebookId={notebookId} />
        </div>
      </div>
    </div>
  );
}
