'use client';

import { useState } from 'react';
import { Plus, FileText, StickyNote } from 'lucide-react';
import { Source, Note } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SourceCard } from './SourceCard';
import { NoteCard } from './NoteCard';
import { AddSourceDialog } from './AddSourceDialog';
import { AddNoteDialog } from './AddNoteDialog';

interface LeftColumnProps {
  notebookId: string;
  sources: Source[];
  setSources: (sources: Source[]) => void;
  notes: Note[];
  setNotes: (notes: Note[]) => void;
}

export function LeftColumn({
  notebookId,
  sources,
  setSources,
  notes,
  setNotes,
}: LeftColumnProps) {
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Sources Section */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-text-primary">Sources</h2>
            <span className="text-xs text-text-tertiary">({sources.length})</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Plus />}
            onClick={() => setAddSourceOpen(true)}
          >
            Add
          </Button>
        </div>

        {sources.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No sources yet"
            description="Add documents, URLs, or text to get started"
            action={
              <Button
                size="sm"
                leftIcon={<Plus />}
                onClick={() => setAddSourceOpen(true)}
              >
                Add Source
              </Button>
            }
          />
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                notebookId={notebookId}
                onDelete={(id: string) => setSources(sources.filter((s) => s.id !== id))}
                onUpdate={(updated: Source) => setSources(sources.map(s => s.id === updated.id ? updated : s))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-secondary" />
            <h2 className="font-semibold text-text-primary">Notes</h2>
            <span className="text-xs text-text-tertiary">({notes.length})</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Plus />}
            onClick={() => setAddNoteOpen(true)}
          >
            Add
          </Button>
        </div>

        {notes.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No notes yet"
            description="Create notes or save AI answers"
            action={
              <Button
                size="sm"
                leftIcon={<Plus />}
                onClick={() => setAddNoteOpen(true)}
              >
                Add Note
              </Button>
            }
          />
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                notebookId={notebookId}
                onDelete={(id: string) => setNotes(notes.filter((n) => n.id !== id))}
                onUpdate={(updated: Note) =>
                  setNotes(notes.map((n) => (n.id === updated.id ? updated : n)))
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddSourceDialog
        open={addSourceOpen}
        onOpenChange={setAddSourceOpen}
        notebookId={notebookId}
        onAdd={(source: Source) => setSources([source, ...sources])}
      />
      <AddNoteDialog
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
        notebookId={notebookId}
        onAdd={(note: Note) => setNotes([note, ...notes])}
      />
    </div>
  );
}
