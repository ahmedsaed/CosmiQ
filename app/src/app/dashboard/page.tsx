'use client';

import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { NotebookCard } from '@/components/notebooks/NotebookCard';
import { CreateNotebookDialog } from '@/components/notebooks/CreateNotebookDialog';
import { apiClient } from '@/lib/api-client';
import { Notebook } from '@/types/api';

export default function DashboardPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { showToast } = useToast();

  // Fetch notebooks
  useEffect(() => {
    loadNotebooks();
  }, []);

  const loadNotebooks = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getNotebooks({ order_by: 'updated desc' });
      setNotebooks(data);
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to load notebooks',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create notebook
  const handleCreate = async (data: { name: string; description?: string }) => {
    try {
      const newNotebook = await apiClient.createNotebook(data);
      setNotebooks([newNotebook, ...notebooks]);
      showToast({
        variant: 'success',
        title: 'Notebook created',
        description: `"${data.name}" has been created successfully`,
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create notebook'
      );
    }
  };

  // Archive/Unarchive notebook
  const handleArchive = async (id: string) => {
    const notebook = notebooks.find((n) => n.id === id);
    if (!notebook) return;

    const isArchiving = !notebook.archived;

    try {
      // Optimistic update
      setNotebooks(
        notebooks.map((n) =>
          n.id === id ? { ...n, archived: isArchiving } : n
        )
      );

      await apiClient.updateNotebook(id, { archived: isArchiving });

      showToast({
        variant: 'success',
        title: isArchiving ? 'Notebook archived' : 'Notebook restored',
        description: `"${notebook.name}" has been ${
          isArchiving ? 'archived' : 'restored'
        }`,
      });
    } catch (error) {
      // Revert on error
      setNotebooks(
        notebooks.map((n) =>
          n.id === id ? { ...n, archived: !isArchiving } : n
        )
      );
      showToast({
        variant: 'error',
        title: 'Failed to update notebook',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  // Delete notebook
  const handleDelete = async (id: string) => {
    const notebook = notebooks.find((n) => n.id === id);
    if (!notebook) return;

    // Simple confirmation (could be replaced with a proper ConfirmDialog component)
    if (
      !confirm(
        `Are you sure you want to delete "${notebook.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      // Optimistic update
      setNotebooks(notebooks.filter((n) => n.id !== id));

      await apiClient.deleteNotebook(id);

      showToast({
        variant: 'success',
        title: 'Notebook deleted',
        description: `"${notebook.name}" has been deleted`,
      });
    } catch (error) {
      // Revert on error
      loadNotebooks();
      showToast({
        variant: 'error',
        title: 'Failed to delete notebook',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const activeNotebooks = notebooks.filter((n) => !n.archived);
  const archivedNotebooks = notebooks.filter((n) => n.archived);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-text-primary">My Notebooks</h1>
            <Button
              leftIcon={<Plus />}
              onClick={() => setCreateDialogOpen(true)}
              disabled={loading}
            >
              Create Notebook
            </Button>
          </div>
          <p className="text-text-secondary">
            Organize your research with notebooks
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && notebooks.length === 0 && (
          <EmptyState
            icon="📚"
            title="No notebooks yet"
            description="Create your first notebook to start organizing your research"
            action={
              <Button
                leftIcon={<Plus />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Your First Notebook
              </Button>
            }
          />
        )}

        {/* Active Notebooks */}
        {!loading && activeNotebooks.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeNotebooks.map((notebook) => (
                <NotebookCard
                  key={notebook.id}
                  notebook={notebook}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Archived Notebooks Section */}
        {!loading && archivedNotebooks.length > 0 && (
          <div className="mt-12">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
            >
              {showArchived ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
              <span className="font-medium">
                Archived ({archivedNotebooks.length})
              </span>
            </button>

            {showArchived && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archivedNotebooks.map((notebook) => (
                  <NotebookCard
                    key={notebook.id}
                    notebook={notebook}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Dialog */}
        <CreateNotebookDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreate}
        />
      </div>
    </div>
  );
}
