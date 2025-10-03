'use client';

import { useEffect, useState } from 'react';
import { X, FileText, StickyNote, Lightbulb, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import type { Source, Note, SourceInsight } from '@/types/api';

interface ReferenceModalProps {
  referenceId: string;
  onClose: () => void;
}

type ReferenceItem = Source | Note | SourceInsight;
type ReferenceType = 'source' | 'note' | 'source_insight';

export function ReferenceModal({ referenceId, onClose }: ReferenceModalProps) {
  const [item, setItem] = useState<ReferenceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<ReferenceType | null>(null);

  useEffect(() => {
    loadReference();
  }, [referenceId]);

  const loadReference = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine type from ID prefix
      let refType: ReferenceType;

      if (referenceId.startsWith('source_insight:')) {
        refType = 'source_insight';
      } else if (referenceId.startsWith('note:')) {
        refType = 'note';
      } else if (referenceId.startsWith('source:')) {
        refType = 'source';
      } else {
        throw new Error('Unknown reference type');
      }

      setType(refType);

      // Fetch the item based on type - use FULL ID with prefix
      let fetchedItem: ReferenceItem;
      if (refType === 'source') {
        fetchedItem = await apiClient.getSource(referenceId);
      } else if (refType === 'note') {
        fetchedItem = await apiClient.getNote(referenceId);
      } else {
        // For insights, we need to add the endpoint to api-client
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5055'}/api/insights/${referenceId}`);
        if (!response.ok) throw new Error('Failed to fetch insight');
        fetchedItem = await response.json();
      }

      setItem(fetchedItem);
    } catch (err: any) {
      console.error('Failed to load reference:', err);
      setError(err.message || 'Failed to load reference');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'source':
        return <FileText className="w-5 h-5 text-primary" />;
      case 'note':
        return <StickyNote className="w-5 h-5 text-secondary" />;
      case 'source_insight':
        return <Lightbulb className="w-5 h-5 text-accent-warning" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'source':
        return 'Source';
      case 'note':
        return 'Note';
      case 'source_insight':
        return 'Insight';
      default:
        return 'Reference';
    }
  };

  const getTitle = () => {
    if (!item) return '';
    
    // Try title first
    if ('title' in item && item.title) return item.title;
    
    // For insights, use insight_type
    if ('insight_type' in item && item.insight_type) return item.insight_type;
    
    // For notes without title, use content preview
    if ('content' in item && item.content) {
      const preview = item.content.slice(0, 50).trim();
      return preview + (item.content.length > 50 ? '...' : '');
    }
    
    // For sources without title, use full_text preview
    if ('full_text' in item && item.full_text) {
      const preview = item.full_text.slice(0, 50).trim();
      return preview + (item.full_text.length > 50 ? '...' : '');
    }
    
    return 'Untitled';
  };

  const getContent = () => {
    if (!item) return '';
    if ('content' in item && item.content) return item.content;
    if ('full_text' in item && item.full_text) return item.full_text;
    return 'No content available';
  };

  const getMetadata = () => {
    if (!item) return null;
    
    const metadata: { label: string; value: string }[] = [];
    
    if ('created' in item && item.created) {
      metadata.push({
        label: 'Created',
        value: new Date(item.created).toLocaleDateString(),
      });
    }
    
    if ('asset' in item && item.asset?.type) {
      metadata.push({
        label: 'Source Type',
        value: item.asset.type,
      });
    }
    
    if ('note_type' in item && item.note_type) {
      metadata.push({
        label: 'Note Type',
        value: item.note_type === 'ai' ? 'AI Generated' : 'Manual',
      });
    }
    
    if ('insight_type' in item && item.insight_type) {
      metadata.push({
        label: 'Insight Type',
        value: item.insight_type,
      });
    }
    
    return metadata;
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <div className="text-xs text-text-tertiary">{getTypeLabel()}</div>
              <h2 className="font-semibold text-text-primary">
                {loading ? 'Loading...' : error ? 'Error' : getTitle()}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-card/50 transition-colors text-text-tertiary hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-accent-error">
              <p className="mb-2">Failed to load reference</p>
              <p className="text-sm text-text-tertiary">{error}</p>
            </div>
          ) : (
            <>
              {/* Metadata */}
              {getMetadata() && getMetadata()!.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-border">
                  {getMetadata()!.map((meta, idx) => (
                    <div key={idx}>
                      <div className="text-xs text-text-tertiary">{meta.label}</div>
                      <div className="text-sm text-text-secondary">{meta.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-text-primary">
                  {getContent()}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
