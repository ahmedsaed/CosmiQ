'use client';

import { useState } from 'react';
import { Mic, User } from 'lucide-react';
import { EpisodeProfilesSection } from './EpisodeProfilesSection';
import { SpeakerProfilesSection } from './SpeakerProfilesSection';

type SubTab = 'episodes' | 'speakers';

export function PodcastsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('episodes');

  const subTabs = [
    { id: 'episodes' as SubTab, label: 'Episode Profiles', icon: Mic },
    { id: 'speakers' as SubTab, label: 'Speaker Profiles', icon: User },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Podcast Configuration</h2>
        <p className="text-sm text-text-secondary mt-1">
          Manage episode profiles and speaker configurations for podcast generation
        </p>
      </div>

      {/* Sub-Tabs */}
      <div className="flex gap-2 border-b border-border">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 border-b-2 transition-all
                ${
                  activeSubTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-tertiary hover:text-text-primary'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Content */}
      <div>
        {activeSubTab === 'episodes' && <EpisodeProfilesSection />}
        {activeSubTab === 'speakers' && <SpeakerProfilesSection />}
      </div>
    </div>
  );
}
