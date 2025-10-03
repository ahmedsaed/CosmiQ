'use client';

import { ReactNode, useState } from 'react';
import { MoreVertical } from 'lucide-react';

export interface BaseCardProps {
  onClick?: () => void;
  icon?: ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  title: string;
  subtitle?: string;
  preview?: string;
  badge?: ReactNode;
  menuItems?: Array<{
    label: string;
    onClick: (e: React.MouseEvent) => void;
    icon?: ReactNode;
    variant?: 'default' | 'danger';
    disabled?: boolean;
  }>;
  borderHoverColor?: string;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}

export function BaseCard({
  onClick,
  icon,
  iconBgColor = 'bg-primary/10',
  iconTextColor = 'text-primary',
  title,
  subtitle,
  preview,
  badge,
  menuItems = [],
  borderHoverColor = 'hover:border-primary/30',
  loading = false,
  className = '',
  children,
}: BaseCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const hasMenu = menuItems.length > 0;

  return (
    <div
      className={`group relative p-3 rounded-lg bg-card/50 hover:bg-card border border-border/50 ${borderHoverColor} transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {icon && (
          <div className={`flex-shrink-0 p-2 rounded ${iconBgColor} ${iconTextColor}`}>
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-text-primary truncate">{title}</h4>
            {badge}
          </div>

          {subtitle && (
            <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>
          )}

          {preview && (
            <p className="text-xs text-text-tertiary line-clamp-2 mt-1">{preview}</p>
          )}

          {children && <div className="mt-2">{children}</div>}
        </div>

        {/* Actions Menu */}
        {hasMenu && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              disabled={loading}
              className="p-1 rounded hover:bg-hover text-text-secondary hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-8 z-20 w-48 glass-card border border-border shadow-lg rounded-lg overflow-hidden">
                  {menuItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        item.onClick(e);
                        setShowMenu(false);
                      }}
                      disabled={item.disabled || loading}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        item.variant === 'danger'
                          ? 'text-danger hover:bg-danger/10'
                          : 'text-text-primary hover:bg-card/50'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
