'use client';

import { useState, useEffect } from 'react';
import { Wand2, Plus, Play, Trash2, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { BaseModal } from '@/components/shared/BaseModal';
import { BaseCard } from '@/components/shared/BaseCard';
import type { Transformation, Model } from '@/types/api';

interface TransformationsPanelProps {
  notebookId: string;
}

interface TransformationFormData {
  name: string;
  title: string;
  description: string;
  prompt: string;
  apply_default: boolean;
}

export function TransformationsPanel({ notebookId }: TransformationsPanelProps) {
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPlaygroundModal, setShowPlaygroundModal] = useState(false);
  const [selectedTransformation, setSelectedTransformation] = useState<Transformation | null>(null);
  const [formData, setFormData] = useState<TransformationFormData>({
    name: '',
    title: '',
    description: '',
    prompt: '',
    apply_default: false,
  });
  
  // Playground state
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundOutput, setPlaygroundOutput] = useState('');
  const [playgroundModel, setPlaygroundModel] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadTransformations();
    loadModels();
  }, []);

  const loadTransformations = async () => {
    try {
      const data = await apiClient.getTransformations();
      setTransformations(data);
    } catch (error: any) {
      console.error('Failed to load transformations:', error);
      showToast({
        title: 'Failed to load transformations',
        description: error.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async () => {
    try {
      const data = await apiClient.getModels({ type: 'language' });
      setModels(data);
      if (data.length > 0) {
        setPlaygroundModel(data[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load models:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const newTransformation = await apiClient.createTransformation(formData);
      setTransformations(prev => [newTransformation, ...prev]);
      setShowCreateModal(false);
      resetForm();
      showToast({
        title: 'Transformation created!',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to create transformation',
        description: error.message,
        variant: 'error',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedTransformation) return;

    try {
      const updated = await apiClient.updateTransformation(selectedTransformation.id, formData);
      setTransformations(prev =>
        prev.map(t => (t.id === updated.id ? updated : t))
      );
      setShowEditModal(false);
      setSelectedTransformation(null);
      resetForm();
      showToast({
        title: 'Transformation updated!',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to update transformation',
        description: error.message,
        variant: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transformation?')) return;

    try {
      await apiClient.deleteTransformation(id);
      setTransformations(prev => prev.filter(t => t.id !== id));
      showToast({
        title: 'Transformation deleted!',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to delete transformation',
        description: error.message,
        variant: 'error',
      });
    }
  };

  const handleExecute = async () => {
    if (!selectedTransformation || !playgroundInput.trim() || !playgroundModel) {
      showToast({
        title: 'Missing required fields',
        description: 'Please select a model and enter input text',
        variant: 'warning',
      });
      return;
    }

    setIsExecuting(true);
    setPlaygroundOutput('');

    try {
      const result = await apiClient.executeTransformation(
        selectedTransformation.id,
        playgroundInput,
        playgroundModel
      );
      setPlaygroundOutput(result.output);
    } catch (error: any) {
      showToast({
        title: 'Execution failed',
        description: error.message,
        variant: 'error',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (transformation: Transformation) => {
    setSelectedTransformation(transformation);
    setFormData({
      name: transformation.name,
      title: transformation.title,
      description: transformation.description,
      prompt: transformation.prompt,
      apply_default: transformation.apply_default,
    });
    setShowEditModal(true);
  };

  const openPlayground = (transformation: Transformation) => {
    setSelectedTransformation(transformation);
    setPlaygroundInput('');
    setPlaygroundOutput('');
    setShowPlaygroundModal(true);
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

  const getMenuItems = (transformation: Transformation) => [
    {
      label: 'Edit',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: () => openEditModal(transformation),
    },
    {
      label: 'Use in Playground',
      icon: <Play className="w-4 h-4" />,
      onClick: () => openPlayground(transformation),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => handleDelete(transformation.id),
      destructive: true,
    },
  ];

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-secondary" />
          <h2 className="font-semibold text-text-primary">Transformations</h2>
          <span className="text-xs text-text-tertiary">
            ({transformations.length})
          </span>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus />}
          onClick={openCreateModal}
        >
          Create
        </Button>
      </div>

      {/* Transformations List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-secondary" />
        </div>
      ) : transformations.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">
          <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No transformations yet</p>
          <p className="text-sm mt-2">
            Create your first transformation to process content with AI
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transformations.map((transformation) => (
            <BaseCard
              key={transformation.id}
              title={transformation.name}
              subtitle={transformation.title}
              menuItems={getMenuItems(transformation)}
            >
              <p className="text-sm text-text-secondary line-clamp-2">
                {transformation.description}
              </p>
              {transformation.apply_default && (
                <div className="mt-2">
                  <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                    Default
                  </span>
                </div>
              )}
            </BaseCard>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <BaseModal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedTransformation(null);
          resetForm();
        }}
        title={showEditModal ? 'Edit Transformation' : 'Create Transformation'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Name
            </label>
            <Input
              placeholder="Enter transformation name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Card Title
            </label>
            <Input
              placeholder="e.g., 'Key Topics'"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <p className="text-xs text-text-tertiary mt-1">
              This will be the title of cards created by this transformation
            </p>
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
              Prompt
            </label>
            <Textarea
              placeholder="Enter the transformation prompt..."
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              rows={8}
            />
            <p className="text-xs text-text-tertiary mt-1">
              Define how the AI should process the input
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.apply_default}
              onChange={(e) => setFormData({ ...formData, apply_default: e.target.checked })}
              className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-2 focus:ring-primary/50"
            />
            <span className="text-sm text-text-secondary">
              Suggest by default on new sources
            </span>
          </label>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={showEditModal ? handleUpdate : handleCreate}
              className="flex-1"
            >
              {showEditModal ? 'Update' : 'Create'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedTransformation(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Playground Modal */}
      <BaseModal
        isOpen={showPlaygroundModal}
        onClose={() => {
          setShowPlaygroundModal(false);
          setSelectedTransformation(null);
          setPlaygroundInput('');
          setPlaygroundOutput('');
        }}
        title={`Playground: ${selectedTransformation?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Model
            </label>
            <select
              value={playgroundModel}
              onChange={(e) => setPlaygroundModel(e.target.value)}
              className="w-full px-3 py-2 rounded bg-card border border-border text-text-primary focus:outline-none focus:border-primary"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Input Text
            </label>
            <Textarea
              placeholder="Enter text to transform..."
              value={playgroundInput}
              onChange={(e) => setPlaygroundInput(e.target.value)}
              rows={6}
            />
          </div>

          <Button
            onClick={handleExecute}
            disabled={isExecuting || !playgroundInput.trim()}
            leftIcon={isExecuting ? <Loader2 className="animate-spin" /> : <Play />}
            className="w-full"
          >
            {isExecuting ? 'Executing...' : 'Run Transformation'}
          </Button>

          {playgroundOutput && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Output
              </label>
              <div className="p-4 rounded bg-card/50 border border-border">
                <pre className="text-sm text-text-primary whitespace-pre-wrap font-mono">
                  {playgroundOutput}
                </pre>
              </div>
            </div>
          )}
        </div>
      </BaseModal>
    </div>
  );
}
