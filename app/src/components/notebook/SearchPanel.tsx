'use client';

import { useState } from 'react';
import { Search as SearchIcon, FileText, StickyNote, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';
import { SourceDetailModal } from './SourceDetailModal';
import { NoteDetailModal } from './NoteDetailModal';
import type { SearchResult } from '@/types/api';

interface SearchPanelProps {
  notebookId: string;
}

export function SearchPanel({ notebookId }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'text' | 'vector'>('text');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      showToast({ title: 'Please enter a search query', variant: 'warning' });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setIsExpanded(true); // Auto-expand when searching

    try {
      console.log(`Performing ${searchType} search for:`, query);
      
      const response = await apiClient.searchNotebook(query, {
        searchType,
        notebookId,
        limit: 20,
      });

      console.log(`${searchType} search response:`, response);
      
      // Transform backend response to match our interface
      const transformedResults: SearchResult[] = (response.results || []).map((result: any) => {
        // Determine type from ID prefix or parent_id
        const idStr = String(result.id || '');
        const parentIdStr = String(result.parent_id || result.id || '');
        let type: 'source' | 'note' = 'source';
        
        if (idStr.includes('note:') || parentIdStr.includes('note:')) {
          type = 'note';
        } else if (idStr.includes('source:') || parentIdStr.includes('source:')) {
          type = 'source';
        }
        
        // Get score from relevance or similarity
        const score = result.relevance || result.similarity || result.score || 0;
        
        return {
          id: result.id || result.parent_id || '',
          title: result.title || null,
          content: result.content || null,
          type,
          score: typeof score === 'number' ? score : 0,
          notebook_id: notebookId,
          created: result.created || new Date().toISOString(),
          parent_id: result.parent_id,
          relevance: result.relevance,
          similarity: result.similarity,
        };
      });

      setResults(transformedResults);
      
      if (transformedResults.length === 0) {
        showToast({
          title: 'No results found',
          description: `Try a different query or switch to ${searchType === 'text' ? 'vector' : 'text'} search`,
          variant: 'info',
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      showToast({
        title: 'Search failed',
        description: error.message || 'Failed to search. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Use parent_id which contains the actual source/note ID with prefix
    // e.g., "source:xyz" or "note:abc"
    // The backend API expects the full ID with table prefix
    const idToUse = result.parent_id || result.id;
    
    if (result.type === 'source') {
      setSelectedSourceId(idToUse);
    } else if (result.type === 'note') {
      setSelectedNoteId(idToUse);
    }
  };

  const truncate = (text: string | null, length: number) => {
    if (!text) return '';
    return text.length > length ? text.slice(0, length) + '...' : text;
  };

  const highlightQuery = (text: string | null) => {
    if (!text || !query.trim() || searchType === 'vector') return text || '';
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? 
        <mark key={i} className="bg-primary/30 text-primary font-medium">{part}</mark> : 
        part
    );
  };

  const formatScore = (score: number) => {
    if (!score || isNaN(score)) return '0';
    return Math.round(score * 100);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SearchIcon className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-text-primary">Search</h2>
          {hasSearched && !isSearching && (
            <span className="text-xs text-text-tertiary">
              ({results.length} result{results.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search Type Toggle */}
          <div className="flex items-center gap-1 bg-card/50 rounded-lg p-1">
            <button
              onClick={() => setSearchType('text')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                searchType === 'text'
                  ? 'bg-primary text-background'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
              title="Text search finds exact keyword matches"
            >
              Text
            </button>
            <button
              onClick={() => setSearchType('vector')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                searchType === 'vector'
                  ? 'bg-secondary text-background'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
              title="Vector search finds semantically similar content"
            >
              Vector
            </button>
          </div>
          
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-card/50 transition-colors text-text-tertiary hover:text-text-primary"
            title={isExpanded ? 'Collapse search' : 'Expand search'}
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
          {/* Search Input */}
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder={`Search with ${searchType} search...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              leftIcon={isSearching ? <Loader2 className="animate-spin" /> : <SearchIcon />}
            >
              Search
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-2">
            {isSearching && (
              <div className="text-center py-8 text-text-tertiary">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>Searching with {searchType} search...</p>
              </div>
            )}

            {!isSearching && hasSearched && results.length === 0 && (
              <div className="text-center py-8 text-text-tertiary">
                <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results found</p>
                <p className="text-sm mt-2">Try a different search query</p>
              </div>
            )}

            {!isSearching && !hasSearched && (
              <div className="text-center py-8 text-text-tertiary">
                <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter a query to search</p>
                <p className="text-sm mt-2">
                  {searchType === 'text' 
                    ? 'Exact text matching' 
                    : 'Semantic similarity search'}
                </p>
              </div>
            )}

            {!isSearching && results.length > 0 && (
              <div className="max-h-[500px] overflow-y-auto space-y-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="glass-card p-4 hover:bg-card hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {result.type === 'source' ? (
                          <FileText className="w-5 h-5 text-primary" />
                        ) : (
                          <StickyNote className="w-5 h-5 text-success" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-medium text-text-primary break-words">
                            {result.title || `Untitled ${result.type}`}
                          </h3>
                          {searchType === 'vector' && (
                            <span className="flex-shrink-0 px-2 py-0.5 text-xs rounded bg-accent-warning/10 text-accent-warning font-medium">
                              {formatScore(result.score)}%
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-text-secondary line-clamp-2 break-words">
                          {highlightQuery(truncate(result.content, 150))}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary">
                          <span className="capitalize">{result.type || 'unknown'}</span>
                          <span>•</span>
                          <span>{formatDate(result.created)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {selectedSourceId && (
        <SourceDetailModal
          onClose={() => setSelectedSourceId(null)}
          sourceId={selectedSourceId}
          notebookId={notebookId}
          onUpdate={() => {
            // Optionally refresh search results after update
          }}
          onDelete={() => {
            setSelectedSourceId(null);
          }}
        />
      )}

      {selectedNoteId && (
        <NoteDetailModal
          onClose={() => setSelectedNoteId(null)}
          noteId={selectedNoteId}
          notebookId={notebookId}
          onUpdate={() => {
            // Optionally refresh search results after update
          }}
          onDelete={() => {
            setSelectedNoteId(null);
          }}
        />
      )}
    </div>
  );
}
