'use client';

import { useState, useEffect } from 'react';
import { Wand2, Plus, Trash2, Save, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { BaseModal } from '@/components/shared/BaseModal';
import { BaseCard } from '@/components/shared/BaseCard';
import type { Transformation, Source, SourceInsight, Model } from '@/types/api';

interface TransformationsPanelProps {
  notebookId: string;
}

interface ApplyFormData {
  sourceId: string;
  transformationId: string;
  modelId: string;
}

export function TransformationsPanel({ notebookId }: TransformationsPanelProps) {
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [insights, setInsights] = useState<SourceInsight[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<SourceInsight | null>(null);
  const [formData, setFormData] = useState<ApplyFormData>({
    sourceId: '',
    transformationId: '',
    modelId: '',
  });
  const [applying, setApplying] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [notebookId]);

  const loadData = async () => {
    try {
      const [transData, sourcesData, modelsData] = await Promise.all([
        apiClient.getTransformations(),
        apiClient.getSources({ notebook_id: notebookId }),
        apiClient.getModels({ type: 'language' }),
      ]);
      
      setTransformations(transData);
      setSources(sourcesData);
      setModels(modelsData);
      
      // Set defaults
      if (sourcesData.length > 0) {
        setFormData(prev => ({ ...prev, sourceId: sourcesData[0].id }));
      }
      if (transData.length > 0) {
        setFormData(prev => ({ ...prev, transformationId: transData[0].id }));
      }
      if (modelsData.length > 0) {
        setFormData(prev => ({ ...prev, modelId: modelsData[0].id }));
      }
      
      // Load all insights for sources in this notebook
      await loadInsights(sourcesData);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      showToast({
        title: 'Failed to load generations',
        description: error.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async (sourcesToLoad: Source[]) => {
    try {
      // Fetch insights for all sources in parallel
      const insightPromises = sourcesToLoad.map(source =>
        apiClient.getSourceInsights(source.id).catch(error => {
          console.error(`Failed to load insights for source ${source.id}:`, error);
          return [] as SourceInsight[];
        })
      );
      
      const insightArrays = await Promise.all(insightPromises);
      const allInsights = insightArrays.flat();
      
      setInsights(allInsights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  const handleApply = async () => {
    if (!formData.sourceId || !formData.transformationId) {
      showToast({
        title: 'Missing required fields',
        description: 'Please select a source and transformation',
        variant: 'warning',
      });
      return;
    }

    setApplying(true);

    try {
      const insight = await apiClient.createSourceInsight(
        formData.sourceId,
        formData.transformationId,
        formData.modelId || undefined
      );

      // Add to the list optimistically
      setInsights(prev => [insight, ...prev]);
      setShowApplyModal(false);
      
      showToast({
        title: 'Generation complete!',
        description: 'Insight generated successfully',
        variant: 'success',
      });
      
      // Reload insights to ensure we have the latest from the backend
      await loadInsights(sources);
    } catch (error: any) {
      showToast({
        title: 'Failed to generate',
        description: error.message,
        variant: 'error',
      });
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = async (insightId: string) => {
    if (!confirm('Are you sure you want to delete this insight?')) return;

    try {
      await apiClient.deleteInsight(insightId);
      setInsights(prev => prev.filter(i => i.id !== insightId));
      showToast({
        title: 'Insight deleted!',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to delete insight',
        description: error.message,
        variant: 'error',
      });
    }
  };

  const handleSaveAsNote = async (insight: SourceInsight) => {
    try {
      await apiClient.saveInsightAsNote(insight.id, notebookId);
      showToast({
        title: 'Saved as note!',
        description: 'Insight converted to note successfully',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to save as note',
        description: error.message,
        variant: 'error',
      });
    }
  };

  const viewInsight = (insight: SourceInsight) => {
    setSelectedInsight(insight);
    setShowInsightModal(true);
  };

  const getSourceTitle = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    return source?.title || 'Unknown Source';
  };

  const getMenuItems = (insight: SourceInsight) => [
    {
      label: 'View Details',
      icon: <FileText className="w-4 h-4" />,
      onClick: () => viewInsight(insight),
    },
    {
      label: 'Save as Note',
      icon: <Save className="w-4 h-4" />,
      onClick: () => handleSaveAsNote(insight),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => handleDelete(insight.id),
      destructive: true,
    },
  ];

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-secondary" />
            <h2 className="font-semibold text-text-primary">Generations</h2>
          </div>
          <span className="text-xs text-text-tertiary mt-1">
            {insights.length} {insights.length === 1 ? 'insight' : 'insights'}
          </span>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus />}
          onClick={() => setShowApplyModal(true)}
          disabled={sources.length === 0 || transformations.length === 0}
        >
          Generate
        </Button>
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-secondary" />
        </div>
      ) : transformations.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 glass-card bg-accent-warning/10 border border-accent-warning/30">
            <Wand2 className="w-12 h-12 mx-auto mb-4 text-accent-warning" />
            <p className="font-medium text-accent-warning mb-2">No Transformation Types Available</p>
            <p className="text-sm text-text-secondary">
              Please create transformation types in Settings to generate insights
            </p>
          </div>
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">
          <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No sources in this notebook</p>
          <p className="text-sm mt-2">
            Add sources to generate insights from your content
          </p>
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">
          <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No insights generated yet</p>
          <p className="text-sm mt-2">
            Click Generate to extract insights from your sources
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <BaseCard
              key={insight.id}
              title={insight.insight_type}
              subtitle={getSourceTitle(insight.source_id)}
              menuItems={getMenuItems(insight)}
            >
              <p className="text-sm text-text-secondary line-clamp-3 mt-2">
                {insight.content}
              </p>
            </BaseCard>
          ))}
        </div>
      )}

      {/* Apply Transformation Modal */}
      <BaseModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply Transformation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Source *
            </label>
            <select
              value={formData.sourceId}
              onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
              className="w-full px-3 py-2 rounded bg-card border border-border text-text-primary focus:outline-none focus:border-primary"
            >
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.title || 'Untitled'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Transformation *
            </label>
            <select
              value={formData.transformationId}
              onChange={(e) => setFormData({ ...formData, transformationId: e.target.value })}
              className="w-full px-3 py-2 rounded bg-card border border-border text-text-primary focus:outline-none focus:border-primary"
            >
              {transformations.map((trans) => (
                <option key={trans.id} value={trans.id}>
                  {trans.name} - {trans.title}
                </option>
              ))}
            </select>
            {formData.transformationId && (
              <p className="text-xs text-text-tertiary mt-1">
                {transformations.find(t => t.id === formData.transformationId)?.description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Model (Optional)
            </label>
            <select
              value={formData.modelId}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
              className="w-full px-3 py-2 rounded bg-card border border-border text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="">Use Default</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleApply}
              disabled={applying || !formData.sourceId || !formData.transformationId}
              leftIcon={applying ? <Loader2 className="animate-spin" /> : <Wand2 />}
              className="flex-1"
            >
              {applying ? 'Applying...' : 'Apply Transformation'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowApplyModal(false)}
              disabled={applying}
            >
              Cancel
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* View Insight Modal */}
      <BaseModal
        isOpen={showInsightModal}
        onClose={() => {
          setShowInsightModal(false);
          setSelectedInsight(null);
        }}
        title={selectedInsight?.insight_type || 'Insight'}
        size="lg"
      >
        {selectedInsight && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Source
              </label>
              <p className="text-text-primary">{getSourceTitle(selectedInsight.source_id)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Content
              </label>
              <div className="p-4 rounded bg-card/50 border border-border">
                <pre className="text-sm text-text-primary whitespace-pre-wrap">
                  {selectedInsight.content}
                </pre>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => handleSaveAsNote(selectedInsight)}
                leftIcon={<Save />}
                className="flex-1"
              >
                Save as Note
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowInsightModal(false);
                  setSelectedInsight(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
}
