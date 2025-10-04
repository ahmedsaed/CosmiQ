'use client';

import { useState, useEffect } from 'react';
import { Plus, User, Trash2, Edit, Users } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { SpeakerProfile, CreateSpeakerProfileData } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { ItemsList } from '@/components/shared/ItemsList';
import { BaseCard } from '@/components/shared/BaseCard';
import { FormDialog } from '@/components/shared/FormDialog';
import { ActionMenu, ActionMenuItem } from '@/components/shared/ActionMenu';

export function SpeakerProfilesSection() {
  const [profiles, setProfiles] = useState<SpeakerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SpeakerProfile | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [formData, setFormData] = useState<CreateSpeakerProfileData>({
    name: '',
    voice_profile: '',
    voice_provider: '',
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSpeakerProfiles();
      setProfiles(data);
    } catch (error: any) {
      showToast({
        title: 'Failed to load speaker profiles',
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
      voice_profile: '',
      voice_provider: '',
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.voice_profile) {
      showToast({
        title: 'Please fill in all required fields',
        variant: 'warning',
      });
      return;
    }

    setFormLoading(true);
    try {
      const newProfile = await apiClient.createSpeakerProfile(formData);
      setProfiles([...profiles, newProfile]);
      setShowAddDialog(false);
      resetForm();
      showToast({
        title: 'Speaker profile created successfully',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to create speaker profile',
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
      const updated = await apiClient.updateSpeakerProfile(
        editingProfile.id,
        formData
      );
      setProfiles(profiles.map((p) => (p.id === updated.id ? updated : p)));
      setShowEditDialog(false);
      setEditingProfile(null);
      resetForm();
      showToast({
        title: 'Speaker profile updated successfully',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to update speaker profile',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (profile: SpeakerProfile) => {
    const confirmed = await confirm({
      title: 'Delete Speaker Profile',
      message: `Are you sure you want to delete "${profile.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await apiClient.deleteSpeakerProfile(profile.id);
      setProfiles(profiles.filter((p) => p.id !== profile.id));
      showToast({
        title: 'Speaker profile deleted',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to delete speaker profile',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    }
  };

  const openEditDialog = (profile: SpeakerProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      voice_profile: '', // API may not return this in the same format
      voice_provider: profile.tts_provider || '',
    });
    setShowEditDialog(true);
  };

  const getMenuItems = (profile: SpeakerProfile): ActionMenuItem[] => [
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
          Profile Name *
        </label>
        <Input
          placeholder="e.g., Casual Conversation, Formal Interview"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Voice Profile *
        </label>
        <Input
          placeholder="Voice configuration or profile ID"
          value={formData.voice_profile}
          onChange={(e) =>
            setFormData({ ...formData, voice_profile: e.target.value })
          }
          required
        />
        <p className="text-xs text-text-tertiary mt-1">
          This could be a voice ID, JSON configuration, or profile reference
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Voice Provider
        </label>
        <Input
          placeholder="e.g., elevenlabs, openai"
          value={formData.voice_provider}
          onChange={(e) =>
            setFormData({ ...formData, voice_provider: e.target.value })
          }
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-text-primary">Speaker Profiles</h3>
          <p className="text-sm text-text-tertiary mt-1">
            Configure speaker voices and personalities for podcast generation
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
            icon={<User className="w-5 h-5 text-secondary" />}
            title={profile.name}
            subtitle={
              profile.speakers
                ? `${profile.speakers.length} speaker${profile.speakers.length !== 1 ? 's' : ''}`
                : 'No speakers configured'
            }
            menuItems={getMenuItems(profile)}
          >
            {profile.description && (
              <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                {profile.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.tts_provider && (
                <span className="px-2 py-1 bg-card text-text-tertiary rounded text-xs">
                  Provider: {profile.tts_provider}
                </span>
              )}
              {profile.tts_model && (
                <span className="px-2 py-1 bg-card text-text-tertiary rounded text-xs">
                  Model: {profile.tts_model}
                </span>
              )}
              {profile.speakers && profile.speakers.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-info/10 text-accent-info rounded text-xs">
                  <Users className="w-3 h-3" />
                  {profile.speakers.map(s => s.name).join(', ')}
                </span>
              )}
            </div>
          </BaseCard>
        )}
        keyExtractor={(profile) => profile.id}
        emptyIcon="👤"
        emptyTitle="No speaker profiles yet"
        emptyDescription="Create speaker profiles to define voices for podcast hosts"
        emptyAction={
          <Button
            leftIcon={<Plus />}
            onClick={() => setShowAddDialog(true)}
          >
            Add Speaker Profile
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
        title="Add Speaker Profile"
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
        title="Edit Speaker Profile"
        onSubmit={handleEdit}
        loading={formLoading}
        submitLabel="Save Changes"
      >
        {renderForm()}
      </FormDialog>
    </div>
  );
}
