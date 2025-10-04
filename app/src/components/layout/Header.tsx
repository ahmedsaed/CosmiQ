'use client';

import Link from 'next/link';
import { Settings, BookOpen } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-panel/80 backdrop-blur-glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <BookOpen className="text-primary group-hover:text-primary/80 transition-colors" size={28} />
            <div className="absolute inset-0 blur-lg bg-primary/30 group-hover:bg-primary/50 transition-all -z-10" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">
              CosmiQ
            </h1>
            <p className="text-xs text-text-tertiary">Research Assistant</p>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-hover transition-all"
            aria-label="Settings"
          >
            <Settings size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
