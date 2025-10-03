'use client';

import { useState } from 'react';
import { StickyNote, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { Note } from '@/types/api';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  onAdd: (note: Note) => void;
}

export function AddNoteDialog({
  open,
  onOpenChange,
  notebookId,
  onAdd,
}: AddNoteDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const note = await apiClient.createNote({
        notebook_id: notebookId,
        content: content.trim(),
        title: title.trim() || undefined,
        note_type: 'human',
      });
      
      onAdd(note);
      showToast({
        variant: 'success',
        title: 'Note created',
        description: 'Your note has been created successfully',
      });
      
      // Reset form
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      showToast({
        variant: 'error',
        title: 'Failed to create note',
        description: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setContent('');
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Create a new note in your notebook
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
                Title <span className="text-text-tertiary text-xs">(optional)</span>
              </label>
              <Input
                id="title"
                placeholder="My Note"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-text-primary mb-2">
                Content <span className="text-danger">*</span>
              </label>
              <Textarea
                id="content"
                placeholder="Write your note here..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setError('');
                }}
                error={error}
                disabled={loading}
                rows={8}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !content.trim()}
              isLoading={loading}
              leftIcon={!loading && <StickyNote />}
            >
              {loading ? 'Creating...' : 'Create Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
