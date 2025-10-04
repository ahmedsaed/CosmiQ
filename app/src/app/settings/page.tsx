'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Cpu, Wand2, Mic, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ModelsTab } from '@/components/settings/ModelsTab';
import { TransformationsTab } from '@/components/settings/TransformationsTab';
import { PodcastsTab } from '@/components/settings/PodcastsTab';
import { SystemTab } from '@/components/settings/SystemTab';

type Tab = 'models' | 'transformations' | 'podcasts' | 'system';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('models');

  const tabs = [
    { id: 'models' as Tab, label: 'Models', icon: Cpu },
    { id: 'transformations' as Tab, label: 'Transformations', icon: Wand2 },
    { id: 'podcasts' as Tab, label: 'Podcasts', icon: Mic },
    { id: 'system' as Tab, label: 'System', icon: Info },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
          </div>
          <Button variant="ghost" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
        </div>
        <p className="text-text-secondary mt-2">
          Configure models, transformations, and system preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="glass-card">
        <div className="border-b border-border">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                    ${
                      activeTab === tab.id
                        ? 'bg-primary/20 text-primary'
                        : 'text-text-tertiary hover:text-text-primary hover:bg-card/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'models' && <ModelsTab />}

          {activeTab === 'transformations' && <TransformationsTab />}

          {activeTab === 'podcasts' && <PodcastsTab />}

          {activeTab === 'system' && <SystemTab />}
        </div>
      </div>
    </div>
  );
}
