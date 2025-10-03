'use client';

import { Sparkles, Mic, FileText, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RightColumnProps {
  notebookId: string;
}

export function RightColumn({ notebookId }: RightColumnProps) {
  return (
    <div className="space-y-6">
      {/* Generations Menu */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-accent-warning" />
          <h2 className="font-semibold text-text-primary">Generations</h2>
        </div>

        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Mic />}
            className="w-full justify-start"
            onClick={() => alert('Podcast generation coming soon')}
          >
            Generate Podcast
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FileText />}
            className="w-full justify-start"
            onClick={() => alert('Summary generation coming soon')}
          >
            Create Summary
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Wand2 />}
            className="w-full justify-start"
            onClick={() => alert('Transformation coming soon')}
          >
            Run Transformation
          </Button>
        </div>
      </div>

      {/* Generated Items */}
      <div className="glass-card p-4">
        <h3 className="font-medium text-text-primary mb-4">Generated Items</h3>
        <div className="text-center py-12 text-text-tertiary">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No generated items yet</p>
          <p className="text-xs mt-2">Generated podcasts, summaries, and insights will appear here</p>
        </div>
      </div>
    </div>
  );
}
