'use client';

import { useState, useEffect } from 'react';
import { Info, Save, Settings as SettingsIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { UpdateSettingsData } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

export function SystemTab() {
  const [appSettings, setAppSettings] = useState<UpdateSettingsData>({
    default_content_processing_engine_doc: 'auto',
    default_content_processing_engine_url: 'auto',
    default_embedding_option: 'ask',
    auto_delete_files: 'no',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In the future, we could load current settings from the backend
      // For now, we'll use defaults
    } catch (error: any) {
      showToast({
        title: 'Failed to load system settings',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppSettings = async () => {
    setSaving(true);
    try {
      await apiClient.updateSettings(appSettings);
      showToast({
        title: 'Application settings updated successfully',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to update settings',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-secondary">Loading system settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary">System Settings</h2>
        <p className="text-sm text-text-secondary mt-1">
          Configure application preferences
        </p>
      </div>

      {/* Application Settings Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-medium text-text-primary">Application Settings</h3>
        </div>
        
        <div className="bg-card/50 rounded-lg border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Default Document Processing Engine
            </label>
            <Select
              value={appSettings.default_content_processing_engine_doc || 'auto'}
              onChange={(e) =>
                setAppSettings({
                  ...appSettings,
                  default_content_processing_engine_doc: e.target.value as any,
                })
              }
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'docling', label: 'Docling' },
                { value: 'simple', label: 'Simple' },
              ]}
            />
            <p className="text-xs text-text-tertiary mt-1">
              Choose the engine for processing uploaded documents
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Default URL Processing Engine
            </label>
            <Select
              value={appSettings.default_content_processing_engine_url || 'auto'}
              onChange={(e) =>
                setAppSettings({
                  ...appSettings,
                  default_content_processing_engine_url: e.target.value as any,
                })
              }
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'firecrawl', label: 'Firecrawl' },
                { value: 'jina', label: 'Jina' },
                { value: 'simple', label: 'Simple' },
              ]}
            />
            <p className="text-xs text-text-tertiary mt-1">
              Choose the engine for processing web URLs
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Default Embedding Behavior
            </label>
            <Select
              value={appSettings.default_embedding_option || 'ask'}
              onChange={(e) =>
                setAppSettings({
                  ...appSettings,
                  default_embedding_option: e.target.value as any,
                })
              }
              options={[
                { value: 'ask', label: 'Ask each time' },
                { value: 'always', label: 'Always embed' },
                { value: 'never', label: 'Never embed' },
              ]}
            />
            <p className="text-xs text-text-tertiary mt-1">
              Control when sources are embedded for semantic search
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Auto-delete Uploaded Files
            </label>
            <Select
              value={appSettings.auto_delete_files || 'no'}
              onChange={(e) =>
                setAppSettings({
                  ...appSettings,
                  auto_delete_files: e.target.value as any,
                })
              }
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
            <p className="text-xs text-text-tertiary mt-1">
              Automatically delete files after processing
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              leftIcon={<Save />}
              onClick={handleSaveAppSettings}
              isLoading={saving}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-medium text-text-primary">System Information</h3>
        </div>
        
        <div className="bg-card/50 rounded-lg border border-border p-6">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-text-tertiary">Application</dt>
              <dd className="text-sm text-text-primary mt-1">CosmiQ</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-tertiary">Version</dt>
              <dd className="text-sm text-text-primary mt-1">1.0.0 (Phase 4)</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-tertiary">Environment</dt>
              <dd className="text-sm text-text-primary mt-1">
                {process.env.NODE_ENV || 'development'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-tertiary">Framework</dt>
              <dd className="text-sm text-text-primary mt-1">Next.js 15 + React 18</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
