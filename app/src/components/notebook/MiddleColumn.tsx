'use client';

import { SearchPanel } from './SearchPanel';
import { ChatPanel } from './ChatPanel';

interface MiddleColumnProps {
  notebookId: string;
}

export function MiddleColumn({ notebookId }: MiddleColumnProps) {
  return (
    <div className="space-y-6">
      {/* Search Panel */}
      <SearchPanel notebookId={notebookId} />

      {/* Chat Panel */}
      <ChatPanel notebookId={notebookId} />
    </div>
  );
}
