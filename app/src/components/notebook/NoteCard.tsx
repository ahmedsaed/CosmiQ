'use client';

import { useState } from 'react';
import { Edit2, Trash2, User, Sparkles, MoreVertical } from 'lucide-react';
import { Note } from '@/types/api';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { truncate } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  notebookId: string;
  onDelete: (id: string) => void;
  onUpdate: (note: Note) => void;
}

export function NoteCard({ note, notebookId, onDelete, onUpdate }: NoteCardProps) {
  const [showMenu, setShowMenu] = useState(false);
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
      setShowMenu(false);
    }
  };

  return (
    <div className="group relative p-3 rounded-lg bg-card/50 hover:bg-card border border-border/50 hover:border-secondary/30 transition-all">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded ${
          note.note_type === 'ai' 
            ? 'bg-secondary/10 text-secondary'  
            : 'bg-success/10 text-success'
        }`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-text-primary truncate">
            {note.title || 'Untitled Note'}
          </h4>
          {note.content && (
            <p className="text-xs text-text-tertiary line-clamp-2 mt-1">
              {truncate(note.content, 80)}
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
                  onClick={() => {
                    // TODO: Open edit dialog
                    setShowMenu(false);
                    showToast({
                      variant: 'info',
                      title: 'Coming soon',
                      description: 'Edit functionality will be added in the next update',
                    });
                  }}
                  disabled={loading}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-hover transition-colors text-text-secondary hover:text-text-primary disabled:opacity-50"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
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
