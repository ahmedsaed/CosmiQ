'use client';

import { useState } from 'react';
import { Upload, Globe, Type, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { Source } from '@/types/api';

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  onAdd: (source: Source) => void;
}

type SourceType = 'file' | 'url' | 'text';

export function AddSourceDialog({
  open,
  onOpenChange,
  notebookId,
  onAdd,
}: AddSourceDialogProps) {
  const [type, setType] = useState<SourceType>('text');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (type === 'url' && !url.trim()) {
      setError('URL is required');
      return;
    }
    if (type === 'text' && !text.trim()) {
      setError('Text content is required');
      return;
    }
    if (type === 'file' && !file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let source: Source;

      if (type === 'file' && file) {
        // File upload not yet implemented in API client
        // For now, show a message
        showToast({
          variant: 'info',
          title: 'File upload coming soon',
          description: 'File upload will be implemented in the next update',
        });
        handleClose();
        return;
      } else {
        // Create source from URL or text
        source = await apiClient.createSource({
          notebook_id: notebookId,
          type,
          url: type === 'url' ? url.trim() : undefined,
          content: type === 'text' ? text.trim() : undefined,
          title: title.trim() || undefined,
        });
      }
      
      onAdd(source);
      showToast({
        variant: 'success',
        title: 'Source added',
        description: 'Your source has been added successfully',
      });
      
      // Reset form
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add source');
      showToast({
        variant: 'error',
        title: 'Failed to add source',
        description: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setType('text');
      setUrl('');
      setText('');
      setTitle('');
      setFile(null);
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Source</DialogTitle>
            <DialogDescription>
              Add a document, URL, or text to your notebook
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type Selector */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Source Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType('file')}
                  className={`p-3 rounded-lg border transition-all ${
                    type === 'file'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-border/50'
                  }`}
                  disabled={loading}
                >
                  <Upload className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('url')}
                  className={`p-3 rounded-lg border transition-all ${
                    type === 'url'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-border/50'
                  }`}
                  disabled={loading}
                >
                  <Globe className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('text')}
                  className={`p-3 rounded-lg border transition-all ${
                    type === 'text'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-border/50'
                  }`}
                  disabled={loading}
                >
                  <Type className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">Text</span>
                </button>
              </div>
            </div>

            {/* Title (optional for all types) */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
                Title <span className="text-text-tertiary text-xs">(optional)</span>
              </label>
              <Input
                id="title"
                placeholder="My Source"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* File Upload */}
            {type === 'file' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Select File <span className="text-danger">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={loading}
                  className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50"
                />
                {file && (
                  <p className="mt-2 text-xs text-text-tertiary">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            )}

            {/* URL Input */}
            {type === 'url' && (
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-text-primary mb-2">
                  URL <span className="text-danger">*</span>
                </label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                  }}
                  error={error && !url.trim() ? error : undefined}
                  disabled={loading}
                />
              </div>
            )}

            {/* Text Content */}
            {type === 'text' && (
              <div>
                <label htmlFor="text" className="block text-sm font-medium text-text-primary mb-2">
                  Text Content <span className="text-danger">*</span>
                </label>
                <Textarea
                  id="text"
                  placeholder="Paste your text content here..."
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setError('');
                  }}
                  error={error && !text.trim() ? error : undefined}
                  disabled={loading}
                  rows={6}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              leftIcon={!loading && <Upload />}
            >
              {loading ? 'Adding...' : 'Add Source'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
