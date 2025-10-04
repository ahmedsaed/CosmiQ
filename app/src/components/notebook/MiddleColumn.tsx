'use client';

import { Source, Note } from '@/types/api';
import { SearchPanel } from './SearchPanel';
import { ChatPanel } from './ChatPanel';

interface MiddleColumnProps {
  notebookId: string;
  sources: Source[];
  notes: Note[];
}

export function MiddleColumn({ notebookId, sources, notes }: MiddleColumnProps) {
  return (
    <div className="space-y-6">
      {/* Search Panel */}
      <SearchPanel notebookId={notebookId} />

      {/* Chat Panel */}
      <ChatPanel notebookId={notebookId} />
    </div>
  );
}
