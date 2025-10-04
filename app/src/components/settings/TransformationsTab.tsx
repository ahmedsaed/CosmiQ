'use client';

import { useState, useEffect } from 'react';
import { Plus, Wand2, Trash2, Edit, CheckCircle, Circle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Transformation, CreateTransformationData, UpdateTransformationData } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ItemsList } from '@/components/shared/ItemsList';
import { BaseCard } from '@/components/shared/BaseCard';
import { FormDialog } from '@/components/shared/FormDialog';
import { ActionMenu, ActionMenuItem } from '@/components/shared/ActionMenu';

export function TransformationsTab() {
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTransformation, setEditingTransformation] = useState<Transformation | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [formData, setFormData] = useState<CreateTransformationData>({
    name: '',
    title: '',
    description: '',
    prompt: '',
    apply_default: false,
  });

  useEffect(() => {
    loadTransformations();
  }, []);

  const loadTransformations = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTransformations();
      setTransformations(data);
    } catch (error: any) {
      showToast({
        title: 'Failed to load transformations',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      description: '',
      prompt: '',
      apply_default: false,
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.title || !formData.prompt) {
      showToast({
        title: 'Please fill in all required fields',
        variant: 'warning',
      });
      return;
    }

    setFormLoading(true);
    try {
      const newTransformation = await apiClient.createTransformation(formData);
      setTransformations([...transformations, newTransformation]);
      setShowAddDialog(false);
      resetForm();
      showToast({
        title: 'Transformation created successfully',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to create transformation',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTransformation) return;

    setFormLoading(true);
    try {
      const updated = await apiClient.updateTransformation(
        editingTransformation.id,
        formData as UpdateTransformationData
      );
      setTransformations(transformations.map((t) =>
        t.id === updated.id ? updated : t
      ));
      setShowEditDialog(false);
      setEditingTransformation(null);
      resetForm();
      showToast({
        title: 'Transformation updated successfully',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to update transformation',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (transformation: Transformation) => {
    const confirmed = await confirm({
      title: 'Delete Transformation',
      message: `Are you sure you want to delete "${transformation.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await apiClient.deleteTransformation(transformation.id);
      setTransformations(transformations.filter((t) => t.id !== transformation.id));
      showToast({
        title: 'Transformation deleted',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to delete transformation',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    }
  };

  const openEditDialog = (transformation: Transformation) => {
    setEditingTransformation(transformation);
    setFormData({
      name: transformation.name,
      title: transformation.title,
      description: transformation.description,
      prompt: transformation.prompt,
      apply_default: transformation.apply_default,
    });
    setShowEditDialog(true);
  };

  const getMenuItems = (transformation: Transformation): ActionMenuItem[] => [
    {
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => openEditDialog(transformation),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => handleDelete(transformation),
      variant: 'danger',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Transformation Types</h2>
          <p className="text-sm text-text-secondary mt-1">
            Define transformation types to extract insights from your sources
          </p>
        </div>
        <Button
          leftIcon={<Plus />}
          onClick={() => setShowAddDialog(true)}
        >
          Add Transformation
        </Button>
      </div>

      {/* Transformations List */}
      <ItemsList
        items={transformations}
        renderItem={(transformation) => (
          <BaseCard
            icon={<Wand2 className="w-5 h-5 text-secondary" />}
            title={transformation.title}
            subtitle={transformation.name}
            menuItems={getMenuItems(transformation)}
          >
            <p className="text-sm text-text-secondary mt-2 line-clamp-2">
              {transformation.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {transformation.apply_default ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-success/10 text-accent-success rounded text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Auto-apply
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-card text-text-tertiary rounded text-xs">
                  <Circle className="w-3 h-3" />
                  Manual
                </span>
              )}
            </div>
          </BaseCard>
        )}
        keyExtractor={(transformation) => transformation.id}
        emptyIcon="🪄"
        emptyTitle="No transformations yet"
        emptyDescription="Create transformation types to extract insights from sources"
        emptyAction={
          <Button
            leftIcon={<Plus />}
            onClick={() => setShowAddDialog(true)}
          >
            Add Transformation
          </Button>
        }
        loading={loading}
        maxHeight="500px"
      />

      {/* Add Transformation Dialog */}
      <FormDialog
        isOpen={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          resetForm();
        }}
        title="Add Transformation Type"
        onSubmit={handleAdd}
        loading={formLoading}
        submitLabel="Create"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Name (ID) *
            </label>
            <Input
              placeholder="e.g., summary, key_points, extract_data"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <p className="text-xs text-text-tertiary mt-1">
              Lowercase, no spaces. Used as the transformation identifier.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Title *
            </label>
            <Input
              placeholder="e.g., Summary, Key Points, Extract Data"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Description
            </label>
            <Textarea
              placeholder="What does this transformation do?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Prompt Template *
            </label>
            <Textarea
              placeholder="Enter the prompt that will be used to transform the content..."
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              rows={6}
              required
            />
            <p className="text-xs text-text-tertiary mt-1">
              The source content will be provided to the AI along with this prompt.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="apply_default"
              checked={formData.apply_default}
              onChange={(e) => setFormData({ ...formData, apply_default: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="apply_default" className="text-sm text-text-secondary">
              Apply automatically to new sources
            </label>
          </div>
        </div>
      </FormDialog>

      {/* Edit Transformation Dialog */}
      <FormDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingTransformation(null);
          resetForm();
        }}
        title="Edit Transformation Type"
        onSubmit={handleEdit}
        loading={formLoading}
        submitLabel="Save Changes"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Name (ID) *
            </label>
            <Input
              placeholder="e.g., summary, key_points, extract_data"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Title *
            </label>
            <Input
              placeholder="e.g., Summary, Key Points, Extract Data"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Description
            </label>
            <Textarea
              placeholder="What does this transformation do?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Prompt Template *
            </label>
            <Textarea
              placeholder="Enter the prompt that will be used to transform the content..."
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              rows={6}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="apply_default_edit"
              checked={formData.apply_default}
              onChange={(e) => setFormData({ ...formData, apply_default: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="apply_default_edit" className="text-sm text-text-secondary">
              Apply automatically to new sources
            </label>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
