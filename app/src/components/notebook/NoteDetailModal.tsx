'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Trash2, Loader2, User, Sparkles, Eye, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import type { Note } from '@/types/api';

interface NoteDetailModalProps {
  noteId: string;
  notebookId: string;
  onClose: () => void;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
}

export function NoteDetailModal({ noteId, notebookId, onClose, onUpdate, onDelete }: NoteDetailModalProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [mounted, setMounted] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    loadNote();
  }, [noteId]);

  useEffect(() => {
    // Close on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const loadNote = async () => {
    try {
      setLoading(true);
      const noteData = await apiClient.getNote(noteId);
      setNote(noteData);
      setEditedTitle(noteData.title || '');
      setEditedContent(noteData.content || '');
    } catch (error: any) {
      console.error('Failed to load note:', error);
      showToast({
        title: 'Failed to load note',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!note) return;
    
    setSaving(true);
    try {
      const updated = await apiClient.updateNote(note.id, {
        title: editedTitle,
        content: editedContent,
      });
      
      setNote(updated);
      onUpdate(updated);
      
      showToast({
        title: 'Note saved',
        variant: 'success',
      });
      
      setActiveTab('preview');
    } catch (error: any) {
      showToast({
        title: 'Failed to save note',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    if (!confirm(`Delete "${note.title || 'this note'}"?`)) return;

    try {
      await apiClient.deleteNote(noteId);
      onDelete(noteId);
      showToast({
        title: 'Note deleted',
        variant: 'success',
      });
      onClose();
    } catch (error: any) {
      showToast({
        title: 'Failed to delete note',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    }
  };

  const hasChanges = () => {
    if (!note) return false;
    return editedTitle !== (note.title || '') || editedContent !== (note.content || '');
  };

  if (!mounted) return null;

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="glass-card p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </div>,
      document.body
    );
  }

  if (!note) return null;

  const Icon = note.note_type === 'ai' ? Sparkles : User;
  const iconColor = note.note_type === 'ai' ? 'text-secondary' : 'text-success';

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${note.note_type === 'ai' ? 'bg-secondary/10' : 'bg-success/10'}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">{note.title || 'Untitled Note'}</h2>
              <p className="text-sm text-text-tertiary">
                {note.note_type === 'ai' ? 'AI Generated' : 'Manual Note'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-card/50 transition-colors text-text-tertiary hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'edit'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'preview' ? (
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">
                {note.title || 'Untitled Note'}
              </h3>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-text-primary">
                  {note.content || 'No content'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-tertiary mb-2 block">Title</label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Enter note title..."
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm text-text-tertiary mb-2 block">Content (Markdown supported)</label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="Enter note content..."
                  rows={15}
                  className="w-full font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <Button
            onClick={handleDelete}
            variant="ghost"
            leftIcon={<Trash2 />}
            className="text-danger hover:text-danger"
          >
            Delete
          </Button>
          
          <div className="flex gap-2">
            {activeTab === 'edit' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditedTitle(note.title || '');
                    setEditedContent(note.content || '');
                    setActiveTab('preview');
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !hasChanges()}
                  leftIcon={saving ? <Loader2 className="animate-spin" /> : <Save />}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
