'use client';

import { useState, useEffect } from 'react';
import { Brain, Trash2, Plus, User, Briefcase, Heart, Target, Lightbulb, MoreHorizontal } from 'lucide-react';
import { useUser } from '@kit/supabase/hooks/use-user';

interface Memory {
  id: string;
  key: string;
  value: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  personal: { label: 'Personal', icon: User, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  work: { label: 'Work', icon: Briefcase, color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  preferences: { label: 'Preferences', icon: Heart, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' },
  goals: { label: 'Goals', icon: Target, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  context: { label: 'Context', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  other: { label: 'Other', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

export default function MemoryPage() {
  const { data: user } = useUser();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemory, setNewMemory] = useState({ key: '', value: '', category: 'other' });

  useEffect(() => {
    if (user?.id) {
      fetchMemories();
    }
  }, [user?.id]);

  const fetchMemories = async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`/api/memories?userId=${user.id}`);
      const data = await res.json();
      setMemories(data.memories || []);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!user?.id) return;
    
    try {
      await fetch('/api/memories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, key }),
      });
      setMemories(memories.filter(m => m.key !== key));
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const handleAdd = async () => {
    if (!user?.id || !newMemory.key || !newMemory.value) return;
    
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...newMemory,
        }),
      });
      const data = await res.json();
      if (data.memory) {
        setMemories([data.memory, ...memories.filter(m => m.key !== newMemory.key)]);
        setNewMemory({ key: '', value: '', category: 'other' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding memory:', error);
    }
  };

  const groupedMemories = memories.reduce((acc, memory) => {
    const cat = memory.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(memory);
    return acc;
  }, {} as Record<string, Memory[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <Brain className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Erik's Memory</h1>
              <p className="text-gray-500 dark:text-gray-400">
                {memories.length} {memories.length === 1 ? 'thing' : 'things'} Erik remembers about you
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Memory
          </button>
        </div>

        {/* Empty State */}
        {memories.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Brain className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No memories yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Start chatting with Erik! He'll remember important things about you as you talk.
            </p>
          </div>
        )}

        {/* Memory Categories */}
        <div className="space-y-6">
          {Object.entries(groupedMemories).map(([category, mems]) => {
            const config = categoryConfig[category] || categoryConfig.other;
            const Icon = config.icon;
            
            return (
              <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className={`px-4 py-3 flex items-center gap-2 ${config.color}`}>
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{config.label}</span>
                  <span className="text-sm opacity-75">({mems.length})</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {mems.map((memory) => (
                    <div
                      key={memory.id}
                      className="px-4 py-3 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {memory.key}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">
                          {memory.value}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Learned {new Date(memory.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(memory.key)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Memory Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Add a Memory
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    What should Erik remember?
                  </label>
                  <input
                    type="text"
                    value={newMemory.key}
                    onChange={(e) => setNewMemory({ ...newMemory, key: e.target.value })}
                    placeholder="e.g., Favorite color"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    The answer
                  </label>
                  <input
                    type="text"
                    value={newMemory.value}
                    onChange={(e) => setNewMemory({ ...newMemory, value: e.target.value })}
                    placeholder="e.g., Blue"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newMemory.category}
                    onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newMemory.key || !newMemory.value}
                  className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
