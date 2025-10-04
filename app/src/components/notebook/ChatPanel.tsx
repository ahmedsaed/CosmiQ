'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Loader2, Send, User, Bot, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { ReferenceModal } from './ReferenceModal';
import { SourceDetailModal } from './SourceDetailModal';
import { NoteDetailModal } from './NoteDetailModal';
import type { Source, Note } from '@/types/api';

interface ChatPanelProps {
  notebookId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface Model {
  id: string;
  name: string;
  provider: string;
  model_type: string;
}

export function ChatPanel({ notebookId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Model state
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [loadingModels, setLoadingModels] = useState(true);
  
  // Modal state for references
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [referenceNames, setReferenceNames] = useState<Map<string, string>>(new Map());
  
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load default model on mount
  useEffect(() => {
    loadDefaultModel();
  }, []);

  const loadDefaultModel = async () => {
    try {
      const allModels = await apiClient.getModels({ type: 'language' });
      
      if (allModels.length === 0) {
        showToast({
          title: 'No models configured',
          description: 'Please configure models in the Models page',
          variant: 'warning',
        });
        setLoadingModels(false);
        return;
      }
      
      // Auto-select first model as default
      let selectedModel = allModels[0].id;
      
      // Try to get default model from settings
      try {
        const defaults = await apiClient.getDefaultModels();
        if (defaults.default_chat_model) {
          selectedModel = defaults.default_chat_model;
        }
      } catch (e) {
        console.log('No default chat model set, using first available');
      }
      
      setDefaultModel(selectedModel);
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) {
      showToast({ title: 'Please enter a message', variant: 'warning' });
      return;
    }

    if (!defaultModel) {
      showToast({ 
        title: 'No model available', 
        description: 'Please configure models in the Models page',
        variant: 'warning' 
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    // Add user message and empty assistant message
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsStreaming(true);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      let fullAnswer = '';

      await apiClient.askStream(
        userMessage.content,
        defaultModel, // strategy model
        defaultModel, // answer model
        defaultModel, // final answer model
        (chunk) => {
          // Handle different chunk types
          if (chunk.type === 'answer' && chunk.content) {
            fullAnswer += chunk.content;
            // Update the assistant message with accumulated content
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: fullAnswer, isStreaming: true }
                  : msg
              )
            );
          } else if (chunk.type === 'final_answer' && chunk.final_answer) {
            fullAnswer = chunk.final_answer;
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: fullAnswer, isStreaming: true }
                  : msg
              )
            );
          }
        },
        () => {
          // On complete - mark as no longer streaming
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
          setIsStreaming(false);
        },
        (error) => {
          // On error
          console.error('Chat error:', error);
          setIsStreaming(false);
          // Remove the failed assistant message
          setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
          showToast({
            title: 'Message failed',
            description: error.message || 'Failed to send message. Please try again.',
            variant: 'error',
          });
        }
      );
    } catch (error: any) {
      console.error('Chat error:', error);
      setIsStreaming(false);
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      showToast({
        title: 'Message failed',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleSaveLastMessage = async () => {
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
    if (!lastAssistantMessage) {
      showToast({ title: 'No message to save', variant: 'warning' });
      return;
    }

    try {
      // Find the corresponding user message
      const messageIndex = messages.findIndex(m => m.id === lastAssistantMessage.id);
      const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;

      await apiClient.createNote({
        notebook_id: notebookId,
        content: lastAssistantMessage.content,
        title: userMessage?.content.slice(0, 100) || 'Chat Response',
        note_type: 'ai',
      });

      showToast({
        title: 'Saved as note!',
        description: 'Message saved to notebook',
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isStreaming) {
      handleSendMessage();
    }
  };

  // Handle reference click - open appropriate modal based on type
  const handleReferenceClick = async (refId: string) => {
    try {
      if (refId.startsWith('source:')) {
        // Open SourceDetailModal
        setSelectedSourceId(refId);
      } else if (refId.startsWith('note:')) {
        // Open NoteDetailModal
        setSelectedNoteId(refId);
      } else if (refId.startsWith('source_insight:')) {
        // Keep using ReferenceModal for insights (no full detail modal exists)
        setSelectedReference(refId);
      }
    } catch (error) {
      console.error(`Failed to load reference ${refId}:`, error);
      showToast({
        title: 'Failed to load reference',
        description: 'Could not load the referenced item',
        variant: 'error',
      });
    }
  };

  // Handle source update from modal (no action needed, modal manages its own state)
  const handleSourceUpdate = (updatedSource: Source) => {
    // Could refresh reference names if needed
  };

  // Handle note update from modal (no action needed, modal manages its own state)
  const handleNoteUpdate = (updatedNote: Note) => {
    // Could refresh reference names if needed
  };

  // Parse references from the latest assistant message and fetch their names
  useEffect(() => {
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
    if (!lastAssistantMessage) return;

    const parseReferences = async () => {
      // Match patterns like [source:id], [note:id], [source_insight:id]
      // Also handles comma-separated references like [note:id, source:id]
      const referenceRegex = /\[([^\]]+)\]/g;
      const matches = lastAssistantMessage.content.match(referenceRegex);

      if (!matches) return;

      const newNames = new Map(referenceNames);
      const allRefIds: string[] = [];

      // Extract all reference IDs (handling comma-separated ones)
      for (const match of matches) {
        const innerContent = match.slice(1, -1); // Remove [ and ]
        const parts = innerContent.split(',').map((p: string) => p.trim());
        
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
  }, [messages]);

  // Render message content with clickable references (for assistant messages)
  const renderMessageWithReferences = (content: string) => {
    // Split by reference pattern (handles both single and comma-separated)
    const referenceRegex = /\[([^\]]+)\]/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = referenceRegex.exec(content)) !== null) {
      // Add text before the reference
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      const innerContent = match[1]; // Content inside brackets
      const refParts = innerContent.split(',').map((p: string) => p.trim());
      
      // Check if all parts are valid references
      const allValidRefs = refParts.every((part: string) => 
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
                onClick={() => handleReferenceClick(refId)}
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
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="glass-card p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-secondary" />
          <h2 className="font-semibold text-text-primary">Chat</h2>
          {messages.length > 0 && (
            <span className="text-xs text-text-tertiary">
              ({messages.length} messages)
            </span>
          )}
        </div>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Save />}
            onClick={handleSaveLastMessage}
            disabled={isStreaming}
            className="text-xs"
          >
            Save Last
          </Button>
        )}
      </div>

      {/* Messages List - Scrollable with fixed height */}
      <div className="overflow-y-auto mb-4 space-y-4 h-[500px] border border-border/50 rounded-lg p-4 bg-background/30">
        {!loadingModels && !defaultModel ? (
          <div className="text-center py-16">
            <div className="p-4 glass-card bg-accent-warning/10 border border-accent-warning/30 max-w-md mx-auto">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-accent-warning" />
              <p className="font-medium text-accent-warning mb-2">No Models Configured</p>
              <p className="text-sm text-text-secondary">
                Please configure language models in the Models page before using Chat
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-text-tertiary">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation</p>
            <p className="text-sm mt-2">
              Ask questions about your sources and the AI will respond based on your content
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Assistant icon on left */}
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-secondary" />
                </div>
              )}

              {/* Message content */}
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'glass-card bg-card/30'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.role === 'user'
                    ? message.content
                    : renderMessageWithReferences(message.content)}
                  {message.isStreaming && (
                    <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin" />
                  )}
                </div>
                <div className="text-xs text-text-tertiary mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {/* User icon on right */}
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 items-center">
        <Textarea
          placeholder={loadingModels ? "Loading models..." : "Type your message... (Ctrl+Enter to send)"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={1}
          className="flex-1 min-h-[42px] resize-none"
          disabled={isStreaming || loadingModels || !defaultModel}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || isStreaming || loadingModels || !defaultModel}
          leftIcon={isStreaming ? <Loader2 className="animate-spin" /> : <Send />}
          className="px-6 py-3"
        >
          {isStreaming ? 'Sending...' : 'Send'}
        </Button>
      </div>

      {/* Reference Modals */}
      {/* For source_insight references - use simple ReferenceModal */}
      {selectedReference && (
        <ReferenceModal
          referenceId={selectedReference}
          onClose={() => setSelectedReference(null)}
        />
      )}

      {/* For source references - use full SourceDetailModal */}
      {selectedSourceId && (
        <SourceDetailModal
          sourceId={selectedSourceId}
          notebookId={notebookId}
          onClose={() => setSelectedSourceId(null)}
          onUpdate={handleSourceUpdate}
          onDelete={() => setSelectedSourceId(null)}
        />
      )}

      {/* For note references - use full NoteDetailModal */}
      {selectedNoteId && (
        <NoteDetailModal
          noteId={selectedNoteId}
          notebookId={notebookId}
          onClose={() => setSelectedNoteId(null)}
          onUpdate={handleNoteUpdate}
          onDelete={() => setSelectedNoteId(null)}
        />
      )}
    </div>
  );
}
