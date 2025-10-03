'use client';

import { useState, useEffect } from 'react';
import { Mic, Play, Download, Trash2, Loader2, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { BaseModal } from '@/components/shared/BaseModal';
import { BaseCard } from '@/components/shared/BaseCard';
import type { PodcastEpisode, EpisodeProfile, SpeakerProfile } from '@/types/api';

interface PodcastsPanelProps {
  notebookId: string;
}

interface GenerateFormData {
  episodeName: string;
  episodeProfile: string;
  speakerProfile: string;
  content: string;
  briefingSuffix: string;
}

export function PodcastsPanel({ notebookId }: PodcastsPanelProps) {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [episodeProfiles, setEpisodeProfiles] = useState<EpisodeProfile[]>([]);
  const [speakerProfiles, setSpeakerProfiles] = useState<SpeakerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formData, setFormData] = useState<GenerateFormData>({
    episodeName: '',
    episodeProfile: '',
    speakerProfile: '',
    content: '',
    briefingSuffix: '',
  });
  const [generating, setGenerating] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [notebookId]);

  const loadData = async () => {
    try {
      const [episodesData, profilesData, speakersData] = await Promise.all([
        apiClient.getPodcastEpisodes(notebookId),
        apiClient.getEpisodeProfiles(),
        apiClient.getSpeakerProfiles(),
      ]);
      setEpisodes(episodesData);
      setEpisodeProfiles(profilesData);
      setSpeakerProfiles(speakersData);
      
      // Set default profiles
      if (profilesData.length > 0) {
        setFormData(prev => ({ ...prev, episodeProfile: profilesData[0].name }));
      }
      if (speakersData.length > 0) {
        setFormData(prev => ({ ...prev, speakerProfile: speakersData[0].name }));
      }
    } catch (error: any) {
      console.error('Failed to load podcast data:', error);
      showToast({
        title: 'Failed to load podcasts',
        description: error.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.episodeName || !formData.episodeProfile || !formData.speakerProfile) {
      showToast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'warning',
      });
      return;
    }

    setGenerating(true);

    try {
      const response = await apiClient.generatePodcast(
        formData.episodeProfile,
        formData.speakerProfile,
        formData.episodeName,
        notebookId,
        formData.content,
        formData.briefingSuffix
      );

      showToast({
        title: 'Podcast generation started!',
        description: `Episode "${formData.episodeName}" is being generated`,
        variant: 'success',
      });

      setShowGenerateModal(false);
      resetForm();
      
      // Reload episodes after a short delay
      setTimeout(loadData, 2000);
    } catch (error: any) {
      showToast({
        title: 'Generation failed',
        description: error.message,
        variant: 'error',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (episodeId: string) => {
    if (!confirm('Are you sure you want to delete this episode?')) return;

    try {
      await apiClient.deletePodcastEpisode(episodeId);
      setEpisodes(prev => prev.filter(e => e.id !== episodeId));
      showToast({
        title: 'Episode deleted!',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to delete episode',
        description: error.message,
        variant: 'error',
      });
    }
  };

  const handleDownload = (audioFile: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5055';
    window.open(`${apiUrl}${audioFile}`, '_blank');
  };

  const resetForm = () => {
    setFormData({
      episodeName: '',
      episodeProfile: episodeProfiles[0]?.name || '',
      speakerProfile: speakerProfiles[0]?.name || '',
      content: '',
      briefingSuffix: '',
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-accent-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-accent-error" />;
      case 'processing':
      case 'submitted':
        return <Clock className="w-4 h-4 text-accent-warning animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-text-tertiary" />;
    }
  };

  const getMenuItems = (episode: PodcastEpisode) => {
    const items = [];
    
    if (episode.audio_file) {
      items.push({
        label: 'Download',
        icon: <Download className="w-4 h-4" />,
        onClick: () => handleDownload(episode.audio_file!),
      });
    }
    
    items.push({
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => handleDelete(episode.id),
      destructive: true,
    });
    
    return items;
  };

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-secondary" />
          <h2 className="font-semibold text-text-primary">Podcasts</h2>
          <span className="text-xs text-text-tertiary">
            ({episodes.length})
          </span>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus />}
          onClick={() => setShowGenerateModal(true)}
          disabled={episodeProfiles.length === 0 || speakerProfiles.length === 0}
        >
          Generate
        </Button>
      </div>

      {/* Episodes List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-secondary" />
        </div>
      ) : episodeProfiles.length === 0 || speakerProfiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 glass-card bg-accent-warning/10 border border-accent-warning/30">
            <Mic className="w-12 h-12 mx-auto mb-4 text-accent-warning" />
            <p className="font-medium text-accent-warning mb-2">No Profiles Configured</p>
            <p className="text-sm text-text-secondary">
              Please configure Episode and Speaker profiles in Settings before generating podcasts
            </p>
          </div>
        </div>
      ) : episodes.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">
          <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No podcast episodes yet</p>
          <p className="text-sm mt-2">
            Generate your first podcast from your notebook content
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {episodes.map((episode) => (
            <BaseCard
              key={episode.id}
              title={episode.name}
              subtitle={episode.episode_profile?.name || 'Unknown Profile'}
              menuItems={getMenuItems(episode)}
            >
              <div className="flex items-center gap-2 mt-2">
                {getStatusIcon(episode.job_status)}
                <span className="text-xs text-text-tertiary capitalize">
                  {episode.job_status || 'Unknown'}
                </span>
                {episode.audio_file && (
                  <span className="text-xs text-accent-success ml-2">
                    • Audio Available
                  </span>
                )}
              </div>
              {episode.briefing && (
                <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                  {episode.briefing}
                </p>
              )}
            </BaseCard>
          ))}
        </div>
      )}

      {/* Generate Modal */}
      <BaseModal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          resetForm();
        }}
        title="Generate Podcast Episode"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Episode Name *
            </label>
            <Input
              placeholder="e.g., 'Episode 1: Introduction'"
              value={formData.episodeName}
              onChange={(e) => setFormData({ ...formData, episodeName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Episode Profile *
            </label>
            <select
              value={formData.episodeProfile}
              onChange={(e) => setFormData({ ...formData, episodeProfile: e.target.value })}
              className="w-full px-3 py-2 rounded bg-card border border-border text-text-primary focus:outline-none focus:border-primary"
            >
              {episodeProfiles.map((profile) => (
                <option key={profile.id} value={profile.name}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Speaker Profile *
            </label>
            <select
              value={formData.speakerProfile}
              onChange={(e) => setFormData({ ...formData, speakerProfile: e.target.value })}
              className="w-full px-3 py-2 rounded bg-card border border-border text-text-primary focus:outline-none focus:border-primary"
            >
              {speakerProfiles.map((profile) => (
                <option key={profile.id} value={profile.name}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Custom Content (Optional)
            </label>
            <Textarea
              placeholder="Leave empty to use notebook content..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
            />
            <p className="text-xs text-text-tertiary mt-1">
              If empty, will use content from the current notebook
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Briefing Suffix (Optional)
            </label>
            <Input
              placeholder="Additional context for the episode..."
              value={formData.briefingSuffix}
              onChange={(e) => setFormData({ ...formData, briefingSuffix: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={generating || !formData.episodeName}
              leftIcon={generating ? <Loader2 className="animate-spin" /> : <Mic />}
              className="flex-1"
            >
              {generating ? 'Generating...' : 'Generate Episode'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowGenerateModal(false);
                resetForm();
              }}
              disabled={generating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
