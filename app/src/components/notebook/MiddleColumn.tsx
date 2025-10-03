'use client';

import { SearchPanel } from './SearchPanel';
import { AskPanel } from './AskPanel';

interface MiddleColumnProps {
  notebookId: string;
}

export function MiddleColumn({ notebookId }: MiddleColumnProps) {
  return (
    <div className="space-y-6">
      {/* Search Panel */}
      <SearchPanel notebookId={notebookId} />

      {/* Ask Panel */}
      <AskPanel notebookId={notebookId} />
    </div>
  );
}
