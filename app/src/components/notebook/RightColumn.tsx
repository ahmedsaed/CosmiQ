'use client';

import { useState } from 'react';
import { Wand2, Mic } from 'lucide-react';
import { TransformationsPanel } from './TransformationsPanel';
import { PodcastsPanel } from './PodcastsPanel';

interface RightColumnProps {
  notebookId: string;
}

type Tab = 'transformations' | 'podcasts';

export function RightColumn({ notebookId }: RightColumnProps) {
  const [activeTab, setActiveTab] = useState<Tab>('transformations');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="glass-card p-2">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('transformations')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'transformations'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-card/50'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            Generations
          </button>
          <button
            onClick={() => setActiveTab('podcasts')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'podcasts'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-card/50'
            }`}
          >
            <Mic className="w-4 h-4" />
            Podcasts
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'transformations' && (
        <TransformationsPanel notebookId={notebookId} />
      )}
      {activeTab === 'podcasts' && (
        <PodcastsPanel notebookId={notebookId} />
      )}
    </div>
  );
}
