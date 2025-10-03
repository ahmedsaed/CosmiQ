'use client';

import { useState } from 'react';
import { Edit2, Trash2, User, Sparkles } from 'lucide-react';
import { Note } from '@/types/api';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { truncate } from '@/lib/utils';
import { BaseCard } from '@/components/shared/BaseCard';
import { NoteDetailModal } from './NoteDetailModal';

interface NoteCardProps {
  note: Note;
  notebookId: string;
  onDelete: (id: string) => void;
  onUpdate: (note: Note) => void;
}

export function NoteCard({ note, notebookId, onDelete, onUpdate }: NoteCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const Icon = note.note_type === 'ai' ? Sparkles : User;

  const handleDelete = async () => {
    if (!confirm(`Delete "${note.title || 'this note'}"?`)) return;

    setLoading(true);
    try {
      await apiClient.deleteNote(note.id);
      onDelete(note.id);
      showToast({
        variant: 'success',
        title: 'Note deleted',
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to delete note',
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
        iconBgColor={note.note_type === 'ai' ? 'bg-secondary/10' : 'bg-success/10'}
        iconTextColor={note.note_type === 'ai' ? 'text-secondary' : 'text-success'}
        title={note.title || 'Untitled Note'}
        preview={note.content ? truncate(note.content, 80) : undefined}
        borderHoverColor="hover:border-secondary/30"
        loading={loading}
        menuItems={[
          {
            label: 'Edit',
            onClick: () => setShowModal(true),
            icon: <Edit2 className="w-4 h-4" />,
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
        <NoteDetailModal
          noteId={note.id}
          notebookId={notebookId}
          onClose={() => setShowModal(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
