'use client';

import { useState, useMemo } from 'react';
import { Brain, Search, Calendar, Tag } from 'lucide-react';

interface Memory {
  id: string;
  type: 'fact' | 'preference' | 'goal' | 'context' | 'insight';
  content: string;
  createdAt: Date;
}

const mockMemories: Memory[] = [
  { id: '1', type: 'fact', content: 'Works at a tech startup', createdAt: new Date('2024-01-15') },
  { id: '2', type: 'preference', content: 'Prefers concise responses', createdAt: new Date('2024-01-18') },
  { id: '3', type: 'goal', content: 'Wants to improve productivity', createdAt: new Date('2024-01-20') },
  { id: '4', type: 'fact', content: 'Based in Oslo, Norway', createdAt: new Date('2024-01-22') },
  { id: '5', type: 'preference', content: 'Likes dark mode interfaces', createdAt: new Date('2024-01-25') },
  { id: '6', type: 'insight', content: 'Often works late in the evening', createdAt: new Date('2024-01-26') },
  { id: '7', type: 'context', content: 'Currently building an AI assistant', createdAt: new Date('2024-01-27') },
  { id: '8', type: 'goal', content: 'Learning about machine learning', createdAt: new Date('2024-01-28') },
];

const typeConfig = {
  fact: { label: 'Fact', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  preference: { label: 'Preference', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  goal: { label: 'Goal', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
  context: { label: 'Context', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
  insight: { label: 'Insight', bgColor: 'bg-rose-50', textColor: 'text-rose-700', borderColor: 'border-rose-200' },
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export default function MemoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredMemories = useMemo(() => {
    return mockMemories.filter((memory) => {
      const matchesSearch = memory.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType ? memory.type === selectedType : true;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType]);

  const groupedMemories = useMemo(() => {
    const groups: Record<string, Memory[]> = {};
    filteredMemories.forEach((memory) => {
      if (!groups[memory.type]) {
        groups[memory.type] = [];
      }
      groups[memory.type].push(memory);
    });
    return groups;
  }, [filteredMemories]);

  const typeOrder = ['fact', 'preference', 'goal', 'context', 'insight'];
  const sortedTypes = typeOrder.filter((type) => groupedMemories[type]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: '#D4A84B15' }}
            >
              <Brain className="h-5 w-5" style={{ color: '#D4A84B' }} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Memory</h1>
              <p className="text-sm text-gray-500">What I remember about you</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Search & Filter */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                selectedType === null
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {Object.entries(typeConfig).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedType === type
                    ? 'bg-gray-900 text-white'
                    : `${config.bgColor} ${config.textColor} hover:opacity-80`
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Memory Cards */}
        {filteredMemories.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <div 
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#D4A84B15' }}
            >
              <Brain className="h-8 w-8" style={{ color: '#D4A84B' }} />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">No memories yet</h3>
            <p className="max-w-sm text-center text-sm text-gray-500">
              As we chat, I&apos;ll remember important things about you to make our conversations more personal.
            </p>
          </div>
        ) : (
          /* Grouped Memory Cards */
          <div className="space-y-10">
            {sortedTypes.map((type) => {
              const config = typeConfig[type as keyof typeof typeConfig];
              const memories = groupedMemories[type];

              return (
                <section key={type}>
                  {/* Section Header */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
                      {config.label}s
                    </span>
                    <span className="text-xs text-gray-400">{memories.length} memories</span>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {memories.map((memory) => (
                      <div
                        key={memory.id}
                        className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
                      >
                        {/* Gold accent line */}
                        <div 
                          className="absolute left-0 top-0 h-full w-1 opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ backgroundColor: '#D4A84B' }}
                        />
                        
                        {/* Content */}
                        <p className="mb-4 text-[15px] leading-relaxed text-gray-800">
                          {memory.content}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs">{formatDate(memory.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3 w-3 text-gray-300" />
                            <span className={`text-xs font-medium ${config.textColor}`}>
                              {config.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        {filteredMemories.length > 0 && (
          <div className="mt-12 flex items-center justify-center">
            <div className="flex items-center gap-6 rounded-xl border border-gray-100 bg-gray-50/50 px-6 py-3">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">{mockMemories.length}</p>
                <p className="text-xs text-gray-500">Total Memories</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">{Object.keys(typeConfig).length}</p>
                <p className="text-xs text-gray-500">Categories</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-lg font-semibold" style={{ color: '#D4A84B' }}>Active</p>
                <p className="text-xs text-gray-500">Status</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
