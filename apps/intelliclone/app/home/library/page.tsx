'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { 
  Plus, 
  FileText, 
  Briefcase, 
  User, 
  FolderOpen,
  Trash2,
  Upload,
  X,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

type LibraryCategory = 'about_me' | 'business' | 'reference' | 'general';

interface LibraryItem {
  id: string;
  name: string;
  category: LibraryCategory;
  file_type: string | null;
  file_url: string | null;
  file_size: number | null;
  content_text: string | null;
  summary: string | null;
  created_at: string;
}

const categoryConfig: Record<LibraryCategory, { label: string; icon: typeof User; color: string }> = {
  about_me: { label: 'Om meg', icon: User, color: 'bg-blue-50 text-blue-600' },
  business: { label: 'Min bedrift', icon: Briefcase, color: 'bg-amber-50 text-amber-600' },
  reference: { label: 'Referanser', icon: FileText, color: 'bg-green-50 text-green-600' },
  general: { label: 'Generelt', icon: FolderOpen, color: 'bg-gray-50 text-gray-600' },
};

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | 'all'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<LibraryCategory>('general');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const supabase = useSupabase();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, [supabase]);

  // Fetch library items
  const fetchItems = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/library?userId=${userId}`);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching library:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchItems();
    }
  }, [userId, fetchItems]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setUploadFile(file);
      setUploadName(file.name.replace(/\.[^/.]+$/, ''));
      setShowUpload(true);
    }
  }, []);

  // Handle upload
  const handleUpload = async () => {
    if (!userId || !uploadName) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('name', uploadName);
      formData.append('category', uploadCategory);
      
      if (uploadFile) {
        formData.append('file', uploadFile);
      } else if (uploadContent) {
        // If no file, send as JSON with content
        const response = await fetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: uploadName,
            category: uploadCategory,
            contentText: uploadContent,
          }),
        });
        
        if (response.ok) {
          await fetchItems();
          resetUploadForm();
        }
        return;
      }

      const response = await fetch('/api/library', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchItems();
        resetUploadForm();
      }
    } catch (error) {
      console.error('Error uploading:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setShowUpload(false);
    setUploadName('');
    setUploadCategory('general');
    setUploadContent('');
    setUploadFile(null);
  };

  // Handle delete
  const handleDelete = async (itemId: string) => {
    if (!userId || !confirm('Er du sikker på at du vil slette dette?')) return;
    
    try {
      await fetch('/api/library', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, userId }),
      });
      await fetchItems();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/home" 
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Bibliotek</h1>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Legg til
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Category tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Alle
          </button>
          {(Object.entries(categoryConfig) as [LibraryCategory, typeof categoryConfig[LibraryCategory]][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 mb-8 text-center transition-all ${
            isDragging 
              ? 'border-amber-400 bg-amber-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-amber-500' : 'text-gray-300'}`} />
          <p className="text-gray-500 text-sm">
            Dra og slipp filer her, eller{' '}
            <button 
              onClick={() => setShowUpload(true)}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              bla gjennom
            </button>
          </p>
        </div>

        {/* Items grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400">
              {selectedCategory === 'all' 
                ? 'Biblioteket er tomt' 
                : `Ingen elementer i "${categoryConfig[selectedCategory as LibraryCategory]?.label}"`}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              Last opp dokumenter så Erik kan lære om deg
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => {
              const config = categoryConfig[item.category];
              const Icon = config.icon;
              
              return (
                <div
                  key={item.id}
                  className="group bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {config.label}
                        {item.file_size && ` · ${formatFileSize(item.file_size)}`}
                      </p>
                      {item.summary && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Legg til i biblioteket</h2>
              <button 
                onClick={resetUploadForm}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Navn
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="f.eks. 'Min CV' eller 'Bedriftsbeskrivelse'"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(categoryConfig) as [LibraryCategory, typeof categoryConfig[LibraryCategory]][]).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setUploadCategory(key)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                          uploadCategory === key
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${uploadCategory === key ? 'text-amber-600' : 'text-gray-400'}`} />
                        <span className={`text-sm ${uploadCategory === key ? 'text-amber-700 font-medium' : 'text-gray-600'}`}>
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File or text */}
              {uploadFile ? (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{uploadFile.name}</p>
                    <p className="text-sm text-gray-400">{formatFileSize(uploadFile.size)}</p>
                  </div>
                  <button 
                    onClick={() => setUploadFile(null)}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Innhold (eller last opp fil)
                  </label>
                  <textarea
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                    placeholder="Skriv informasjon som Erik skal huske om deg..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none"
                  />
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Last opp fil
                      <input
                        type="file"
                        className="hidden"
                        accept=".txt,.md,.pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadFile(file);
                            if (!uploadName) {
                              setUploadName(file.name.replace(/\.[^/.]+$/, ''));
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={resetUploadForm}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadName || isUploading}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Laster opp...' : 'Legg til'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
