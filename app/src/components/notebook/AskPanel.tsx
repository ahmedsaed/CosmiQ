'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Loader2, Save, ChevronDown, ChevronUp, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { ReferenceModal } from './ReferenceModal';
import type { Model } from '@/types/api';

interface AskPanelProps {
  notebookId: string;
}

interface ConversationItem {
  question: string;
  answer: string;
  timestamp: Date;
}

export function AskPanel({ notebookId }: AskPanelProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasAsked, setHasAsked] = useState(false);
  
  // Modal state for references
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const [referenceNames, setReferenceNames] = useState<Map<string, string>>(new Map());
  
  // Model state
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [strategyModel, setStrategyModel] = useState('');
  const [answerModel, setAnswerModel] = useState('');
  const [finalAnswerModel, setFinalAnswerModel] = useState('');
  
  // Conversation history
  const [history, setHistory] = useState<ConversationItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const { showToast } = useToast();
  const answerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load language models
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const allModels = await apiClient.getModels({ type: 'language' });
      setModels(allModels);
      
      // Auto-select default models if available
      if (allModels.length > 0) {
        const defaultModel = allModels[0].id;
        setStrategyModel(defaultModel);
        setAnswerModel(defaultModel);
        setFinalAnswerModel(defaultModel);
      }
      
      // Try to get default models from settings
      try {
        const defaults = await apiClient.getDefaultModels();
        if (defaults.default_chat_model) {
          setStrategyModel(defaults.default_chat_model);
          setAnswerModel(defaults.default_chat_model);
          setFinalAnswerModel(defaults.default_chat_model);
        }
      } catch (e) {
        console.log('No default models set');
      }
    } catch (error: any) {
      console.error('Failed to load models:', error);
      showToast({
        title: 'Failed to load models',
        description: 'Please configure models in the Models page',
        variant: 'error',
      });
    } finally {
      setLoadingModels(false);
    }
  };

  const handleAskStreaming = async () => {
    if (!question.trim()) {
      showToast({ title: 'Please enter a question', variant: 'warning' });
      return;
    }

    if (!strategyModel || !answerModel || !finalAnswerModel) {
      showToast({
        title: 'Please select models',
        description: 'All three models must be selected',
        variant: 'warning',
      });
      return;
    }

    setIsAsking(true);
    setHasAsked(true);
    setAnswer('');
    setIsExpanded(true);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      console.log('Asking question with streaming:', question);
      
      let fullAnswer = '';
      
      await apiClient.askStream(
        question,
        strategyModel,
        answerModel,
        finalAnswerModel,
        (chunk) => {
          // Handle different chunk types
          if (chunk.type === 'strategy') {
            console.log('Strategy:', chunk.reasoning);
          } else if (chunk.type === 'answer' && chunk.content) {
            fullAnswer += chunk.content;
            setAnswer(fullAnswer);
            // Auto-scroll to bottom
            if (answerRef.current) {
              answerRef.current.scrollTop = answerRef.current.scrollHeight;
            }
          } else if (chunk.type === 'final_answer' && chunk.final_answer) {
            fullAnswer = chunk.final_answer;
            setAnswer(fullAnswer);
          }
        },
        () => {
          // On complete
          console.log('Streaming complete');
          setIsAsking(false);
          
          // Add to history
          if (fullAnswer) {
            setHistory(prev => [
              ...prev,
              { question, answer: fullAnswer, timestamp: new Date() }
            ]);
          }
        },
        (error) => {
          // On error
          console.error('Ask error:', error);
          setIsAsking(false);
          showToast({
            title: 'Ask failed',
            description: error.message || 'Failed to get answer. Please try again.',
            variant: 'error',
          });
        }
      );
    } catch (error: any) {
      console.error('Ask error:', error);
      setIsAsking(false);
      showToast({
        title: 'Ask failed',
        description: error.message || 'Failed to get answer. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleSaveAsNote = async () => {
    if (!answer) {
      showToast({ title: 'No answer to save', variant: 'warning' });
      return;
    }

    try {
      await apiClient.createNote({
        notebook_id: notebookId,
        content: answer,
        title: question.slice(0, 100),
        note_type: 'ai',
      });
      
      showToast({
        title: 'Saved as note!',
        description: 'Answer saved to notebook',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Failed to save note:', error);
      showToast({
        title: 'Failed to save',
        description: error.message || 'Could not save as note',
        variant: 'error',
      });
    }
  };

  const handleClear = () => {
    setQuestion('');
    setAnswer('');
    setHasAsked(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isAsking) {
      handleAskStreaming();
    }
  };

  const loadHistoryItem = (item: ConversationItem) => {
    setQuestion(item.question);
    setAnswer(item.answer);
    setHasAsked(true);
    setShowHistory(false);
  };

  // Parse references from answer text and fetch their names
  useEffect(() => {
    if (!answer) return;

    const parseReferences = async () => {
      // Match patterns like [source:id], [note:id], [source_insight:id]
      // Also handles comma-separated references like [note:id, source:id]
      const referenceRegex = /\[([^\]]+)\]/g;
      const matches = answer.match(referenceRegex);

      if (!matches) return;

      const newNames = new Map(referenceNames);
      const allRefIds: string[] = [];

      // Extract all reference IDs (handling comma-separated ones)
      for (const match of matches) {
        const innerContent = match.slice(1, -1); // Remove [ and ]
        const parts = innerContent.split(',').map(p => p.trim());
        
        for (const part of parts) {
          // Check if it's a valid reference pattern
          if (/^(source_insight|source|note):[a-z0-9]+$/.test(part)) {
            allRefIds.push(part);
          }
        }
      }

      // Fetch names for all references
      for (const refId of allRefIds) {
        if (newNames.has(refId)) continue; // Already fetched

        try {
          let name = '';
          const type = refId.split(':')[0];
          
          if (refId.startsWith('source_insight:')) {
            const insight = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5055'}/api/insights/${refId}`).then(r => r.json());
            name = insight.insight_type || insight.title || 'Insight';
          } else if (refId.startsWith('source:')) {
            const source = await apiClient.getSource(refId);
            name = source.title || 'Untitled Source';
          } else if (refId.startsWith('note:')) {
            const note = await apiClient.getNote(refId);
            // Better fallback: use content preview if no title
            if (note.title) {
              name = note.title;
            } else if (note.content) {
              // Use first 30 chars of content as fallback
              name = note.content.slice(0, 30).trim() + '...';
            } else {
              name = 'AI Note';
            }
          }

          newNames.set(refId, name);
        } catch (error) {
          console.error(`Failed to fetch name for ${refId}:`, error);
          // Better fallback based on type
          const type = refId.split(':')[0];
          const fallbackNames: Record<string, string> = {
            'source_insight': 'Insight',
            'source': 'Source',
            'note': 'Note',
          };
          newNames.set(refId, fallbackNames[type] || 'Reference');
        }
      }

      setReferenceNames(newNames);
    };

    parseReferences();
  }, [answer]);

  // Render answer with clickable references
  const renderAnswerWithReferences = () => {
    if (!answer) return null;

    // Split by reference pattern (handles both single and comma-separated)
    const referenceRegex = /\[([^\]]+)\]/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = referenceRegex.exec(answer)) !== null) {
      // Add text before the reference
      if (match.index > lastIndex) {
        parts.push(answer.substring(lastIndex, match.index));
      }

      const innerContent = match[1]; // Content inside brackets
      const refParts = innerContent.split(',').map(p => p.trim());
      
      // Check if all parts are valid references
      const allValidRefs = refParts.every(part => 
        /^(source_insight|source|note):[a-z0-9]+$/.test(part)
      );

      if (allValidRefs && refParts.length > 0) {
        // Render clickable references
        const refButtons = refParts.map((refId, idx) => {
          const refName = referenceNames.get(refId) || 'Loading...';
          // Truncate long names to 20 characters
          const displayName = refName.length > 20 
            ? refName.slice(0, 20) + '...' 
            : refName;
          
          return (
            <span key={`${key}-${idx}`}>
              {idx > 0 && ', '}
              <button
                onClick={() => setSelectedReference(refId)}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-colors border border-primary/30"
                title={`Click to view: ${refName}`}
              >
                {displayName}
              </button>
            </span>
          );
        });

        parts.push(
          <span key={key++} className="inline-flex items-center">
            [{refButtons}]
          </span>
        );
      } else {
        // Not a reference, keep original text
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < answer.length) {
      parts.push(answer.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-secondary" />
          <h2 className="font-semibold text-text-primary">Ask</h2>
          {hasAsked && !isAsking && answer && (
            <span className="text-xs text-text-tertiary">
              ({answer.split(' ').length} words)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* History Toggle */}
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-2 py-1 text-xs rounded bg-card/50 hover:bg-card transition-colors text-text-secondary hover:text-text-primary"
              title="View conversation history"
            >
              History ({history.length})
            </button>
          )}
          
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-card/50 transition-colors text-text-tertiary hover:text-text-primary"
            title={isExpanded ? 'Collapse ask panel' : 'Expand ask panel'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <>
          {/* History Dropdown */}
          {showHistory && history.length > 0 && (
            <div className="mb-4 max-h-40 overflow-y-auto space-y-1 glass-card p-3">
              <div className="text-xs font-medium text-text-secondary mb-2">Recent Questions</div>
              {history.slice().reverse().map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => loadHistoryItem(item)}
                  className="w-full text-left p-2 rounded text-sm hover:bg-card/50 transition-colors text-text-secondary hover:text-text-primary"
                >
                  <div className="truncate">{item.question}</div>
                  <div className="text-xs text-text-tertiary">
                    {item.timestamp.toLocaleTimeString()}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Model Selection */}
          {!loadingModels && models.length === 0 ? (
            <div className="mb-4 p-4 glass-card bg-accent-warning/10 border border-accent-warning/30">
              <div className="flex items-center gap-2 text-accent-warning mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium text-sm">No Models Configured</span>
              </div>
              <p className="text-xs text-text-secondary">
                Please configure language models in the Models page before using Ask
              </p>
            </div>
          ) : (
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Strategy Model */}
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Strategy Model</label>
                <select
                  value={strategyModel}
                  onChange={(e) => setStrategyModel(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded bg-card border border-border text-text-primary focus:outline-none focus:border-primary transition-colors"
                  disabled={loadingModels || isAsking}
                >
                  {loadingModels ? (
                    <option>Loading...</option>
                  ) : (
                    models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Answer Model */}
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Answer Model</label>
                <select
                  value={answerModel}
                  onChange={(e) => setAnswerModel(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded bg-card border border-border text-text-primary focus:outline-none focus:border-primary transition-colors"
                  disabled={loadingModels || isAsking}
                >
                  {loadingModels ? (
                    <option>Loading...</option>
                  ) : (
                    models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Final Answer Model */}
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Final Answer Model</label>
                <select
                  value={finalAnswerModel}
                  onChange={(e) => setFinalAnswerModel(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded bg-card border border-border text-text-primary focus:outline-none focus:border-primary transition-colors"
                  disabled={loadingModels || isAsking}
                >
                  {loadingModels ? (
                    <option>Loading...</option>
                  ) : (
                    models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Question Input */}
          <Textarea
            placeholder="Ask a question about your sources... (Ctrl+Enter to submit)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={3}
            className="mb-3"
            disabled={isAsking || models.length === 0}
          />

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={handleAskStreaming}
              disabled={!question.trim() || isAsking || !strategyModel || models.length === 0}
              leftIcon={isAsking ? <Loader2 className="animate-spin" /> : <Send />}
              className="flex-1"
            >
              {isAsking ? 'Asking...' : 'Ask'}
            </Button>
            
            {hasAsked && (
              <Button
                variant="ghost"
                onClick={handleClear}
                disabled={isAsking}
                className="px-4"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Answer Display */}
          {(answer || isAsking) && (
            <div className="glass-card p-4 bg-card/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium text-text-secondary">Answer</span>
                  {isAsking && (
                    <span className="text-xs text-text-tertiary">(streaming...)</span>
                  )}
                </div>
                
                {answer && !isAsking && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Save />}
                    onClick={handleSaveAsNote}
                    className="text-xs"
                  >
                    Save as Note
                  </Button>
                )}
              </div>
              
              <div
                ref={answerRef}
                className="text-sm text-text-primary whitespace-pre-wrap max-h-96 overflow-y-auto"
              >
                {answer ? (
                  <div className="leading-relaxed">{renderAnswerWithReferences()}</div>
                ) : (
                  <div className="flex items-center gap-2 text-text-tertiary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!hasAsked && !isAsking && (
            <div className="text-center py-8 text-text-tertiary">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ask questions about your sources</p>
              <p className="text-sm mt-2">
                The AI will search your notebook and provide answers based on your content
              </p>
            </div>
          )}
        </>
      )}

      {/* Reference Modal */}
      {selectedReference && (
        <ReferenceModal
          referenceId={selectedReference}
          onClose={() => setSelectedReference(null)}
        />
      )}
    </div>
  );
}
