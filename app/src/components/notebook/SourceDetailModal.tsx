'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Globe, Type, Sparkles, Loader2, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import type { Source, SourceInsight, Transformation, Model } from '@/types/api';

interface SourceDetailModalProps {
  sourceId: string;
  notebookId: string;
  onClose: () => void;
  onUpdate: (source: Source) => void;
  onDelete: (id: string) => void;
}

export function SourceDetailModal({ sourceId, notebookId, onClose, onUpdate, onDelete }: SourceDetailModalProps) {
  const [source, setSource] = useState<Source | null>(null);
  const [insights, setInsights] = useState<SourceInsight[]>([]);
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [selectedTransformation, setSelectedTransformation] = useState('');
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'process' | 'content'>('process');
  const [mounted, setMounted] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    loadSourceData();
  }, [sourceId]);

  const loadSourceData = async () => {
    try {
      setLoading(true);
      
      // Load source, insights, and transformations in parallel
      const [sourceData, insightsData, transformationsData] = await Promise.all([
        apiClient.getSource(sourceId),
        apiClient.getSourceInsights(sourceId),
        apiClient.getTransformations(),
      ]);

      setSource(sourceData);
      setEditedTitle(sourceData.title || '');
      setInsights(insightsData);
      setTransformations(transformationsData);
      
      if (transformationsData.length > 0) {
        setSelectedTransformation(transformationsData[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load source:', error);
      showToast({
        title: 'Failed to load source',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!source) return;
    
    setSaving(true);
    try {
      const updated = await apiClient.updateSource(source.id, { title: editedTitle });
      setSource(updated);
      onUpdate(updated);
      showToast({
        title: 'Title updated',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to update title',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInsight = async () => {
    if (!selectedTransformation) {
      showToast({
        title: 'Please select a transformation',
        variant: 'warning',
      });
      return;
    }

    setGeneratingInsight(true);
    try {
      await apiClient.createSourceInsight(sourceId, selectedTransformation);
      showToast({
        title: 'Generating insight',
        description: 'This may take a few moments',
        variant: 'success',
      });
      
      // Reload insights after a short delay
      setTimeout(() => loadSourceData(), 2000);
    } catch (error: any) {
      showToast({
        title: 'Failed to generate insight',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setGeneratingInsight(false);
    }
  };

  const handleDeleteInsight = async (insightId: string) => {
    if (!confirm('Delete this insight?')) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5055'}/api/insights/${insightId}`, {
        method: 'DELETE',
      });
      
      setInsights(insights.filter(i => i.id !== insightId));
      showToast({
        title: 'Insight deleted',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to delete insight',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    }
  };

  const handleSaveInsightAsNote = async (insight: SourceInsight) => {
    try {
      await apiClient.createNote({
        notebook_id: notebookId,
        title: `${insight.insight_type} from ${source?.title || 'source'}`,
        content: insight.content,
        note_type: 'ai',
      });
      
      showToast({
        title: 'Saved as note',
        description: 'The insight has been saved to your notebook',
        variant: 'success',
      });
    } catch (error: any) {
      showToast({
        title: 'Failed to save as note',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${source?.title || 'this source'}"? This will also delete all insights and embeddings.`)) return;

    try {
      await apiClient.deleteSource(sourceId);
      onDelete(sourceId);
      showToast({
        title: 'Source deleted',
        variant: 'success',
      });
      onClose();
    } catch (error: any) {
      showToast({
        title: 'Failed to delete source',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    }
  };

  const toggleInsight = (id: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedInsights(newExpanded);
  };

  const getSourceIcon = () => {
    const type = source?.asset?.type || 'text';
    switch (type) {
      case 'url':
      case 'youtube':
        return <Globe className="w-5 h-5" />;
      case 'file':
        return <FileText className="w-5 h-5" />;
      default:
        return <Type className="w-5 h-5" />;
    }
  };

  const getSourceInfo = () => {
    if (!source?.asset) return 'from text';
    if (source.asset.url) return `from URL: ${source.asset.url}`;
    if (source.asset.file_path) return `from file: ${source.asset.file_path}`;
    return 'from text';
  };

  if (!mounted) return null;

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="glass-card p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </div>,
      document.body
    );
  }

  if (!source) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10 text-primary">
              {getSourceIcon()}
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">{source.title || 'Untitled Source'}</h2>
              <p className="text-sm text-text-tertiary">{getSourceInfo()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-card/50 transition-colors text-text-tertiary hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title Editor */}
        <div className="p-6 border-b border-border">
          <label className="text-sm text-text-tertiary mb-2 block">Title</label>
          <div className="flex gap-2">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Enter source title..."
              className="flex-1"
            />
            <Button
              onClick={handleSaveTitle}
              disabled={saving || editedTitle === source.title}
              leftIcon={saving ? <Loader2 className="animate-spin" /> : <Save />}
            >
              Save
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          <button
            onClick={() => setActiveTab('process')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'process'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Process
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Content
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'process' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Insights */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-medium text-text-secondary">Insights</h3>
                
                {insights.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No insights generated yet</p>
                    <p className="text-sm mt-2">Use a transformation to generate insights</p>
                  </div>
                ) : (
                  insights.map((insight) => (
                    <div key={insight.id} className="glass-card p-4 border border-border">
                      <button
                        onClick={() => toggleInsight(insight.id)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <span className="font-medium text-text-primary">{insight.insight_type}</span>
                        {expandedInsights.has(insight.id) ? (
                          <ChevronUp className="w-4 h-4 text-text-tertiary" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-text-tertiary" />
                        )}
                      </button>
                      
                      {expandedInsights.has(insight.id) && (
                        <>
                          <div className="mt-3 text-sm text-text-secondary whitespace-pre-wrap">
                            {insight.content}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveInsightAsNote(insight)}
                            >
                              Save as Note
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteInsight(insight.id)}
                              className="text-danger hover:text-danger"
                            >
                              Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Right: Actions */}
              <div className="space-y-4">
                {/* Run Transformation */}
                <div className="glass-card p-4 border border-border">
                  <h4 className="text-sm font-medium text-text-secondary mb-3">Run Transformation</h4>
                  {transformations.length > 0 ? (
                    <>
                      <select
                        value={selectedTransformation}
                        onChange={(e) => setSelectedTransformation(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-card border border-border text-text-primary text-sm mb-2"
                      >
                        {transformations.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-text-tertiary mb-3">
                        {transformations.find(t => t.id === selectedTransformation)?.description}
                      </p>
                      <Button
                        onClick={handleGenerateInsight}
                        disabled={generatingInsight}
                        leftIcon={generatingInsight ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        className="w-full"
                        size="sm"
                      >
                        Run
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-text-tertiary">
                      No transformations available. Create transformations in the Transformations page.
                    </p>
                  )}
                </div>

                {/* Delete Source */}
                <div className="glass-card p-4 border border-border">
                  <p className="text-xs text-text-tertiary mb-3">
                    Deleting the source will also delete all its insights and embeddings
                  </p>
                  <Button
                    onClick={handleDelete}
                    variant="ghost"
                    leftIcon={<Trash2 />}
                    className="w-full text-danger hover:text-danger"
                    size="sm"
                  >
                    Delete Source
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-4">Content</h3>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-text-primary">
                  {source.full_text || 'No content available'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
}
