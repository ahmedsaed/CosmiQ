'use client';

import { useState } from 'react';
import { FileText, Globe, Type, Trash2, Sparkles } from 'lucide-react';
import { Source } from '@/types/api';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { truncate } from '@/lib/utils';
import { BaseCard } from '@/components/shared/BaseCard';
import { SourceDetailModal } from './SourceDetailModal';

interface SourceCardProps {
  source: Source;
  notebookId: string;
  onDelete: (id: string) => void;
  onUpdate: (source: Source) => void;
}

const sourceIcons = {
  file: FileText,
  url: Globe,
  text: Type,
  youtube: Globe,
};

export function SourceCard({ source, notebookId, onDelete, onUpdate }: SourceCardProps) {
  const [showModal, setShowModal] = useState(false);
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
    }
  };

  const handleGenerateInsight = async () => {
    setLoading(true);
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
    <>
      <BaseCard
        onClick={() => setShowModal(true)}
        icon={<Icon className="w-4 h-4" />}
        title={source.title || 'Untitled Source'}
        preview={source.full_text ? truncate(source.full_text, 80) : undefined}
        loading={loading}
        menuItems={[
          {
            label: 'Generate Insight',
            onClick: handleGenerateInsight,
            icon: <Sparkles className="w-4 h-4" />,
          },
          {
            label: 'Delete',
            onClick: handleDelete,
            icon: <Trash2 className="w-4 h-4" />,
            variant: 'danger',
          },
        ]}
      />

      {/* Detail Modal */}
      {showModal && (
        <SourceDetailModal
          sourceId={source.id}
          notebookId={notebookId}
          onClose={() => setShowModal(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
