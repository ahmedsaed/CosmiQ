'use client';

import { useState, useEffect } from 'react';
import { Plus, Mic, Trash2, Edit } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { EpisodeProfile, CreateEpisodeProfileData } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ItemsList } from '@/components/shared/ItemsList';
import { BaseCard } from '@/components/shared/BaseCard';
import { FormDialog } from '@/components/shared/FormDialog';
import { ActionMenu, ActionMenuItem } from '@/components/shared/ActionMenu';

export function EpisodeProfilesSection() {
  const [profiles, setProfiles] = useState<EpisodeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<EpisodeProfile | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [formData, setFormData] = useState<CreateEpisodeProfileData>({
    name: '',
    description: '',
    speaker_config: '',
    outline_provider: '',
    outline_model: '',
    transcript_provider: '',
    transcript_model: '',
    default_briefing: '',
    num_segments: 5,
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getEpisodeProfiles();
      setProfiles(data);
    } catch (error: any) {
      showToast({
        title: 'Failed to load episode profiles',
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
      description: '',
      speaker_config: '',
      outline_provider: '',
      outline_model: '',
      transcript_provider: '',
      transcript_model: '',
      default_briefing: '',
      num_segments: 5,
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      showToast({
        title: 'Please provide a profile name',
        variant: 'warning',
      });
      return;
    }

    setFormLoading(true);
    try {
      const newProfile = await apiClient.createEpisodeProfile(formData);
      setProfiles([...profiles, newProfile]);
      setShowAddDialog(false);
      resetForm();
      showToast({
        title: 'Episode profile created successfully',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to create episode profile',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProfile) return;

    setFormLoading(true);
    try {
      const updated = await apiClient.updateEpisodeProfile(
        editingProfile.id,
        formData
      );
      setProfiles(profiles.map((p) => (p.id === updated.id ? updated : p)));
      setShowEditDialog(false);
      setEditingProfile(null);
      resetForm();
      showToast({
        title: 'Episode profile updated successfully',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to update episode profile',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (profile: EpisodeProfile) => {
    const confirmed = await confirm({
      title: 'Delete Episode Profile',
      message: `Are you sure you want to delete "${profile.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await apiClient.deleteEpisodeProfile(profile.id);
      setProfiles(profiles.filter((p) => p.id !== profile.id));
      showToast({
        title: 'Episode profile deleted',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to delete episode profile',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    }
  };

  const openEditDialog = (profile: EpisodeProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description || '',
      speaker_config: profile.speaker_config || '',
      outline_provider: profile.outline_provider || '',
      outline_model: profile.outline_model || '',
      transcript_provider: profile.transcript_provider || '',
      transcript_model: profile.transcript_model || '',
      default_briefing: profile.default_briefing || '',
      num_segments: profile.num_segments || 5,
    });
    setShowEditDialog(true);
  };

  const getMenuItems = (profile: EpisodeProfile): ActionMenuItem[] => [
    {
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => openEditDialog(profile),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => handleDelete(profile),
      variant: 'danger',
    },
  ];

  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Name *
        </label>
        <Input
          placeholder="e.g., Research Deep Dive, Weekly Briefing"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Description
        </label>
        <Textarea
          placeholder="What type of podcast episodes should use this profile?"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Outline Provider
          </label>
          <Input
            placeholder="e.g., openai, anthropic"
            value={formData.outline_provider}
            onChange={(e) =>
              setFormData({ ...formData, outline_provider: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Outline Model
          </label>
          <Input
            placeholder="e.g., gpt-4, claude-3"
            value={formData.outline_model}
            onChange={(e) =>
              setFormData({ ...formData, outline_model: e.target.value })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Transcript Provider
          </label>
          <Input
            placeholder="e.g., openai, anthropic"
            value={formData.transcript_provider}
            onChange={(e) =>
              setFormData({ ...formData, transcript_provider: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Transcript Model
          </label>
          <Input
            placeholder="e.g., gpt-4, claude-3"
            value={formData.transcript_model}
            onChange={(e) =>
              setFormData({ ...formData, transcript_model: e.target.value })
            }
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Speaker Configuration
        </label>
        <Input
          placeholder="Speaker profile ID or name"
          value={formData.speaker_config}
          onChange={(e) =>
            setFormData({ ...formData, speaker_config: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Number of Segments
        </label>
        <Input
          type="number"
          min="1"
          max="20"
          placeholder="5"
          value={formData.num_segments}
          onChange={(e) =>
            setFormData({ ...formData, num_segments: parseInt(e.target.value) || 5 })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Default Briefing
        </label>
        <Textarea
          placeholder="Default instructions or briefing for episodes using this profile..."
          value={formData.default_briefing}
          onChange={(e) =>
            setFormData({ ...formData, default_briefing: e.target.value })
          }
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-text-primary">Episode Profiles</h3>
          <p className="text-sm text-text-tertiary mt-1">
            Configure how podcast episodes are structured and generated
          </p>
        </div>
        <Button
          leftIcon={<Plus />}
          onClick={() => setShowAddDialog(true)}
          size="sm"
        >
          Add Profile
        </Button>
      </div>

      {/* Profiles List */}
      <ItemsList
        items={profiles}
        renderItem={(profile) => (
          <BaseCard
            icon={<Mic className="w-5 h-5 text-secondary" />}
            title={profile.name}
            subtitle={`${profile.num_segments} segments`}
            menuItems={getMenuItems(profile)}
          >
            {profile.description && (
              <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                {profile.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.outline_model && (
                <span className="px-2 py-1 bg-card text-text-tertiary rounded text-xs">
                  Outline: {profile.outline_model}
                </span>
              )}
              {profile.transcript_model && (
                <span className="px-2 py-1 bg-card text-text-tertiary rounded text-xs">
                  Transcript: {profile.transcript_model}
                </span>
              )}
            </div>
          </BaseCard>
        )}
        keyExtractor={(profile) => profile.id}
        emptyIcon="🎙️"
        emptyTitle="No episode profiles yet"
        emptyDescription="Create profiles to define how podcast episodes are structured"
        emptyAction={
          <Button
            leftIcon={<Plus />}
            onClick={() => setShowAddDialog(true)}
          >
            Add Episode Profile
          </Button>
        }
        loading={loading}
        maxHeight="450px"
      />

      {/* Add Dialog */}
      <FormDialog
        isOpen={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          resetForm();
        }}
        title="Add Episode Profile"
        onSubmit={handleAdd}
        loading={formLoading}
        submitLabel="Create"
      >
        {renderForm()}
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingProfile(null);
          resetForm();
        }}
        title="Edit Episode Profile"
        onSubmit={handleEdit}
        loading={formLoading}
        submitLabel="Save Changes"
      >
        {renderForm()}
      </FormDialog>
    </div>
  );
}
