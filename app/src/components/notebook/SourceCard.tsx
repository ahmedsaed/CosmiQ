'use client';

import { useState } from 'react';
import { FileText, Globe, Type, Trash2, Sparkles, MoreVertical } from 'lucide-react';
import { Source } from '@/types/api';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { truncate } from '@/lib/utils';

interface SourceCardProps {
  source: Source;
  notebookId: string;
  onDelete: (id: string) => void;
}

const sourceIcons = {
  file: FileText,
  url: Globe,
  text: Type,
  youtube: Globe,
};

export function SourceCard({ source, notebookId, onDelete }: SourceCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const sourceType = source.asset?.type || 'text';
  const Icon = sourceIcons[sourceType as keyof typeof sourceIcons] || FileText;

  const handleDelete = async () => {
    if (!confirm(`Delete "${source.title}"?`)) return;

    setLoading(true);
    try {
      await apiClient.deleteSource(source.id);
      onDelete(source.id);
      showToast({
        variant: 'success',
        title: 'Source deleted',
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to delete source',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleGenerateInsight = async () => {
    setLoading(true);
    setShowMenu(false);
    try {
      // Using a default transformation ID - in a real scenario, user would select one
      await apiClient.createSourceInsight(source.id, 'default');
      showToast({
        variant: 'success',
        title: 'Generating insight',
        description: 'This may take a few moments',
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to generate insight',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative p-3 rounded-lg bg-card/50 hover:bg-card border border-border/50 hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 p-2 rounded bg-primary/10 text-primary">
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-text-primary truncate">
            {source.title || 'Untitled Source'}
          </h4>
          {source.full_text && (
            <p className="text-xs text-text-tertiary line-clamp-2 mt-1">
              {truncate(source.full_text, 80)}
            </p>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={loading}
            className="p-1 rounded hover:bg-hover text-text-secondary hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-48 glass-card border border-border shadow-lg rounded-lg overflow-hidden">
                <button
                  onClick={handleGenerateInsight}
                  disabled={loading}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-hover transition-colors text-text-secondary hover:text-text-primary disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Insight
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-hover transition-colors text-danger hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
