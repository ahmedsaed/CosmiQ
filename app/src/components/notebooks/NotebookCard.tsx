'use client';

import Link from 'next/link';
import { BookOpen, Archive, Trash2, MoreVertical, Calendar } from 'lucide-react';
import { Notebook } from '@/types/api';
import { formatRelativeTime } from '@/lib/utils';
import { useState } from 'react';

interface NotebookCardProps {
  notebook: Notebook;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotebookCard({ notebook, onArchive, onDelete }: NotebookCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    onArchive?.(notebook.id);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete?.(notebook.id);
    setShowMenu(false);
  };

  return (
    <Link
      href={`/notebook/${notebook.id}`}
      className="group relative block"
    >
      <div className="glass-card-hover p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-text-primary truncate group-hover:text-primary transition-colors">
                {notebook.name}
              </h3>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded hover:bg-hover text-text-secondary hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowMenu(false);
                  }}
                />
                
                {/* Menu */}
                <div className="absolute right-0 top-8 z-20 w-48 glass-card border border-border shadow-lg rounded-lg overflow-hidden">
                  <button
                    onClick={handleArchive}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-hover transition-colors text-text-secondary hover:text-text-primary"
                  >
                    <Archive className="w-4 h-4" />
                    {notebook.archived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-hover transition-colors text-danger hover:text-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {notebook.description && (
          <p className="text-text-secondary text-sm mb-4 line-clamp-2 flex-1">
            {notebook.description}
          </p>
        )}

        {/* Footer - Metadata */}
        <div className="flex items-center justify-between text-xs text-text-tertiary pt-4 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Updated {formatRelativeTime(notebook.updated)}</span>
          </div>
          
          {notebook.archived && (
            <span className="px-2 py-1 rounded bg-secondary/10 text-secondary text-xs font-medium">
              Archived
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
