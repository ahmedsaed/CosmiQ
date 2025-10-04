'use client';

import { useState, useEffect } from 'react';
import { Plus, Cpu, Loader2, Trash2, Edit } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Model, CreateModelData, AvailableProvidersResponse } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ItemsList } from '@/components/shared/ItemsList';
import { BaseCard } from '@/components/shared/BaseCard';
import { FormDialog } from '@/components/shared/FormDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ActionMenu, ActionMenuItem } from '@/components/shared/ActionMenu';

export function ModelsTab() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<AvailableProvidersResponse | null>(null);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [formData, setFormData] = useState<CreateModelData>({
    name: '',
    provider: '',
    type: 'language',
  });

  useEffect(() => {
    loadModels();
    loadAvailableProviders();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getModels();
      setModels(data);
    } catch (error: any) {
      showToast({
        title: 'Failed to load models',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProviders = async () => {
    try {
      const data = await apiClient.getAvailableProviders();
      setAvailableProviders(data);
    } catch (error: any) {
      console.error('Failed to load available providers:', error);
      // Don't show error toast, fall back to manual input
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.provider) {
      showToast({
        title: 'Please fill in all required fields',
        variant: 'warning',
      });
      return;
    }

    setFormLoading(true);
    try {
      const newModel = await apiClient.createModel(formData);
      setModels([...models, newModel]);
      setShowAddDialog(false);
      setFormData({ name: '', provider: '', type: 'language' });
      showToast({
        title: 'Model added successfully',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to add model',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (model: Model) => {
    const confirmed = await confirm({
      title: 'Delete Model',
      message: `Are you sure you want to delete "${model.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await apiClient.deleteModel(model.id);
      setModels(models.filter((m) => m.id !== model.id));
      showToast({
        title: 'Model deleted',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to delete model',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'language':
        return '💬';
      case 'embedding':
        return '🔢';
      case 'text_to_speech':
        return '🔊';
      case 'speech_to_text':
        return '🎤';
      default:
        return '🤖';
    }
  };

  const getModelTypeLabel = (type: string) => {
    switch (type) {
      case 'language':
        return 'Language Model (LLM)';
      case 'embedding':
        return 'Embedding Model';
      case 'text_to_speech':
        return 'Text-to-Speech';
      case 'speech_to_text':
        return 'Speech-to-Text';
      default:
        return type;
    }
  };

  const getMenuItems = (model: Model): ActionMenuItem[] => [
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => handleDelete(model),
      variant: 'danger',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">AI Models</h2>
          <p className="text-sm text-text-secondary mt-1">
            Manage language models, embeddings, and TTS/STT models
          </p>
        </div>
        <Button
          leftIcon={<Plus />}
          onClick={() => setShowAddDialog(true)}
        >
          Add Model
        </Button>
      </div>

      {/* Models List */}
      <ItemsList
        items={models}
        renderItem={(model) => (
          <BaseCard
            icon={<span className="text-2xl">{getModelTypeIcon(model.type)}</span>}
            title={model.name}
            subtitle={`${model.provider} • ${getModelTypeLabel(model.type)}`}
            menuItems={getMenuItems(model)}
          >
            <div className="text-xs text-text-tertiary mt-2">
              Added {new Date(model.created).toLocaleDateString()}
            </div>
          </BaseCard>
        )}
        keyExtractor={(model) => model.id}
        emptyIcon="🤖"
        emptyTitle="No models configured"
        emptyDescription="Add your first AI model to get started"
        emptyAction={
          <Button
            leftIcon={<Plus />}
            onClick={() => setShowAddDialog(true)}
          >
            Add Model
          </Button>
        }
        loading={loading}
        maxHeight="500px"
      />

      {/* Add Model Dialog */}
      <FormDialog
        isOpen={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setFormData({ name: '', provider: '', type: 'language' });
        }}
        title="Add New Model"
        onSubmit={handleAdd}
        loading={formLoading}
        submitLabel="Add Model"
      >
        <div className="space-y-4">
          {/* Model Type Selection */}
          <div>
            <Select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as CreateModelData['type'];
                setFormData({ ...formData, type: newType, provider: '' });
              }}
              options={[
                { value: 'language', label: '💬 Language Model (LLM)' },
                { value: 'embedding', label: '🔢 Embedding Model' },
                { value: 'text_to_speech', label: '🔊 Text-to-Speech' },
                { value: 'speech_to_text', label: '🎤 Speech-to-Text' },
              ]}
              placeholder="Select model type"
            />
          </div>

          {/* Provider Selection - Dynamic based on type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Provider *
            </label>
            {availableProviders && availableProviders.providers_by_type[formData.type]?.length > 0 ? (
              <Select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                options={availableProviders.providers_by_type[formData.type].map((provider) => ({
                  value: provider,
                  label: provider.charAt(0).toUpperCase() + provider.slice(1),
                }))}
                placeholder="Select provider"
              />
            ) : (
              <Input
                placeholder="e.g., OpenAI, Anthropic, Ollama"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                required
              />
            )}
            {availableProviders && availableProviders.providers_by_type[formData.type]?.length === 0 && (
              <p className="text-xs text-accent-warning mt-2">
                ⚠️ No providers configured for this model type. Configure API keys in System settings.
              </p>
            )}
          </div>

          {/* Model Name Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Model Name *
            </label>
            <Input
              placeholder="e.g., gpt-4o-mini, claude-3-opus, llama3"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <p className="text-xs text-text-tertiary mt-1">
              Enter the exact model identifier as used by the provider
            </p>
          </div>

          <div className="p-3 bg-accent-info/10 border border-accent-info/30 rounded-lg">
            <p className="text-sm text-text-secondary">
              💡 <strong>Tip:</strong> Make sure the model is accessible from your backend. 
              For Azure, use the deployment name as the model name.
            </p>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
