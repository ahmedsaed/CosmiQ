'use client';

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';

interface ItemsListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  loading?: boolean;
  maxHeight?: string;
  className?: string;
}

export function ItemsList<T>({
  items,
  renderItem,
  keyExtractor,
  emptyIcon = '📦',
  emptyTitle = 'No items',
  emptyDescription = 'Get started by adding your first item',
  emptyAction,
  loading = false,
  maxHeight = '600px',
  className = '',
}: ItemsListProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div
      className={`space-y-3 overflow-y-auto pr-2 ${className}`}
      style={{ maxHeight }}
    >
      {items.map((item) => (
        <div key={keyExtractor(item)}>{renderItem(item)}</div>
      ))}
    </div>
  );
}
