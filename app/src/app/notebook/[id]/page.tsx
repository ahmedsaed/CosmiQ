'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Archive, Trash2, RefreshCw, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { Notebook, Source, Note } from '@/types/api';
import { NotebookLayout } from '@/components/notebook/NotebookLayout';

export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const notebookId = params.id as string;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Load notebook data
  useEffect(() => {
    loadNotebookData();
  }, [notebookId]);

  const loadNotebookData = async () => {
    setLoading(true);
    try {
      const [notebookData, sourcesData, notesData] = await Promise.all([
        apiClient.getNotebook(notebookId),
        apiClient.getSources({ notebook_id: notebookId }),
        apiClient.getNotes({ notebook_id: notebookId }),
      ]);
      setNotebook(notebookData);
      setSources(sourcesData);
      setNotes(notesData);
      setEditedName(notebookData.name);
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to load notebook',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
      // Redirect to dashboard on error
      setTimeout(() => router.push('/dashboard'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Update notebook name
  const handleUpdateName = async () => {
    if (!notebook || !editedName.trim() || editedName === notebook.name) {
      setEditingName(false);
      setEditedName(notebook?.name || '');
      return;
    }

    try {
      const updated = await apiClient.updateNotebook(notebookId, {
        name: editedName.trim(),
      });
      setNotebook(updated);
      setEditingName(false);
      showToast({
        variant: 'success',
        title: 'Notebook updated',
        description: 'Name has been updated successfully',
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to update notebook',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
      setEditedName(notebook.name);
    }
  };

  // Archive notebook
  const handleArchive = async () => {
    if (!notebook) return;
    try {
      await apiClient.updateNotebook(notebookId, { archived: !notebook.archived });
      showToast({
        variant: 'success',
        title: notebook.archived ? 'Notebook restored' : 'Notebook archived',
      });
      router.push('/dashboard');
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to update notebook',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  // Delete notebook
  const handleDelete = async () => {
    if (!notebook) return;
    if (!confirm(`Are you sure you want to delete "${notebook.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiClient.deleteNotebook(notebookId);
      showToast({
        variant: 'success',
        title: 'Notebook deleted',
      });
      router.push('/dashboard');
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to delete notebook',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Loading notebook..." />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Notebook not found</p>
          <Button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Notebook Header */}
      <div className="sticky top-16 z-30 bg-panel/95 backdrop-blur-glass border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back button and Title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft />}
                onClick={() => router.push('/dashboard')}
              >
                Back
              </Button>

              {/* Editable Title */}
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateName();
                        if (e.key === 'Escape') {
                          setEditingName(false);
                          setEditedName(notebook.name);
                        }
                      }}
                      className="flex-1 px-3 py-1 bg-card border border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Check />}
                      onClick={handleUpdateName}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<X />}
                      onClick={() => {
                        setEditingName(false);
                        setEditedName(notebook.name);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-2xl font-bold text-text-primary truncate">
                      {notebook.name}
                    </h1>
                    <button
                      onClick={() => setEditingName(true)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-hover transition-all"
                      aria-label="Edit name"
                    >
                      <Edit2 className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RefreshCw />}
                onClick={loadNotebookData}
              >
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Archive />}
                onClick={handleArchive}
              >
                {notebook.archived ? 'Restore' : 'Archive'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Description */}
          {notebook.description && (
            <p className="text-text-secondary text-sm mt-2 ml-28">
              {notebook.description}
            </p>
          )}
        </div>
      </div>

      {/* Three-Column Layout */}
      <NotebookLayout
        notebookId={notebookId}
        sources={sources}
        setSources={setSources}
        notes={notes}
        setNotes={setNotes}
        onRefresh={loadNotebookData}
      />
    </div>
  );
}
