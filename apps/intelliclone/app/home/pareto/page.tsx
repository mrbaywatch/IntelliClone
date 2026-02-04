'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, Upload, FileText, Loader2, 
  Plus, FolderOpen, Menu, Moon, Sun, Download
} from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser } from '@kit/supabase/hooks/use-user';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  files?: { name: string; type: string }[];
  created_at?: string;
}

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
}

interface Project {
  id: string;
  name: string;
  created_at: string;
  pareto_documents: Document[];
  pareto_messages: Message[];
}

export default function ParetoPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; projectId: string } | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedFilesCache = useRef<Map<string, File>>(new Map());

  // Store files for later download
  const cacheFiles = (files: File[]) => {
    files.forEach(file => {
      uploadedFilesCache.current.set(file.name, file);
    });
  };

  // Download a cached file
  const downloadFile = (fileName: string) => {
    const file = uploadedFilesCache.current.get(fileName);
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeProject?.pareto_messages, streamingText]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Auth check
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/sign-in');
    }
  }, [user, userLoading, router]);

  // Fetch projects from Supabase
  const fetchProjects = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch('/api/pareto/projects', {
        headers: { 'x-user-id': user.id }
      });
      const data = await res.json();
      
      if (data.projects) {
        setProjects(data.projects);
        if (data.projects.length > 0 && !activeProjectId) {
          setActiveProjectId(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsFetching(false);
    }
  }, [user?.id, activeProjectId]);

  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    }
  }, [user?.id, fetchProjects]);

  // Save theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('pareto-theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pareto-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeProject) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!activeProject) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, projectId });
  };

  const createProject = async () => {
    if (!newProjectName.trim() || !user?.id) return;
    
    try {
      const res = await fetch('/api/pareto/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id 
        },
        body: JSON.stringify({ name: newProjectName.trim() })
      });
      
      const data = await res.json();
      if (data.project) {
        await fetchProjects();
        setActiveProjectId(data.project.id);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
    
    setNewProjectName('');
    setShowNewProject(false);
  };

  const deleteProject = async (id: string) => {
    if (!user?.id) return;
    
    try {
      await fetch(`/api/pareto/projects?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id }
      });
      
      await fetchProjects();
      if (activeProjectId === id) {
        const remaining = projects.filter(p => p.id !== id);
        setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
    setContextMenu(null);
  };

  const startRenaming = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setRenamingProjectId(projectId);
      setRenameValue(project.name);
    }
    setContextMenu(null);
  };

  const renameProject = async () => {
    if (!user?.id || !renamingProjectId || !renameValue.trim()) return;
    
    try {
      await fetch(`/api/pareto/projects?id=${renamingProjectId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id 
        },
        body: JSON.stringify({ name: renameValue.trim() })
      });
      
      await fetchProjects();
    } catch (error) {
      console.error('Error renaming project:', error);
    }
    setRenamingProjectId(null);
    setRenameValue('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Simulate streaming effect
  const simulateStreaming = async (fullText: string) => {
    setStreamingText('');
    const words = fullText.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
      setStreamingText(words.slice(0, i + 1).join(' '));
    }
    
    setStreamingText('');
    return fullText;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && uploadedFiles.length === 0) return;
    if (!activeProject || !user?.id) return;

    const userMessage: Message = {
      role: 'user',
      content: input || 'Se vedlagte dokumenter',
      files: uploadedFiles.map(f => ({ name: f.name, type: f.type }))
    };

    // Optimistically update UI
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { ...p, pareto_messages: [...p.pareto_messages, userMessage] }
        : p
    ));
    
    const currentInput = input;
    const currentFiles = [...uploadedFiles]; // Save files before clearing
    cacheFiles(currentFiles); // Cache for download
    setInput('');
    setUploadedFiles([]); // Clear files immediately after sending
    setIsLoading(true);

    try {
      // Save user message
      await fetch('/api/pareto/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id 
        },
        body: JSON.stringify({
          projectId: activeProjectId,
          role: 'user',
          content: userMessage.content,
          files: userMessage.files
        })
      });

      // Get AI response
      const formData = new FormData();
      formData.append('message', currentInput);
      formData.append('projectName', activeProject.name);
      formData.append('history', JSON.stringify(activeProject.pareto_messages));
      currentFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/pareto/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      // Simulate streaming effect
      await simulateStreaming(data.message);
      
      // Save assistant message
      await fetch('/api/pareto/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id 
        },
        body: JSON.stringify({
          projectId: activeProjectId,
          role: 'assistant',
          content: data.message
        })
      });

      // Update UI with assistant message
      setProjects(prev => prev.map(p => 
        p.id === activeProjectId 
          ? { ...p, pareto_messages: [...p.pareto_messages, { role: 'assistant', content: data.message }] }
          : p
      ));
    } catch (error) {
      console.error('Error:', error);
      setProjects(prev => prev.map(p => 
        p.id === activeProjectId 
          ? { ...p, pareto_messages: [...p.pareto_messages, { role: 'assistant', content: 'Beklager, noe gikk galt. Prøv igjen.' }] }
          : p
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Premium theme with refined colors
  const theme = {
    // Backgrounds
    bg: darkMode ? 'bg-[#0a0a0f]' : 'bg-[#f8f9fa]',
    sidebar: darkMode ? 'bg-[#111118]' : 'bg-white',
    header: darkMode ? 'bg-[#111118]/80 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl',
    chat: darkMode ? 'bg-[#0a0a0f]' : 'bg-[#f8f9fa]',
    inputArea: darkMode ? 'bg-[#111118]' : 'bg-white',
    
    // Text
    text: darkMode ? 'text-white' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    textSubtle: darkMode ? 'text-gray-500' : 'text-gray-400',
    
    // Borders
    border: darkMode ? 'border-white/[0.08]' : 'border-gray-200',
    borderSubtle: darkMode ? 'border-white/[0.05]' : 'border-gray-100',
    
    // Interactive
    hover: darkMode ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-50',
    active: darkMode ? 'bg-white/[0.08]' : 'bg-blue-50',
    
    // Messages
    userMsg: 'bg-blue-600 text-white',
    assistantMsg: darkMode 
      ? 'bg-[#1a1a24] text-gray-100 border border-white/[0.08]' 
      : 'bg-white text-gray-800 border border-gray-200 shadow-sm',
    
    // Inputs
    input: darkMode 
      ? 'bg-white/[0.05] border-white/[0.08] text-white placeholder-gray-500' 
      : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400',
    
    // Buttons
    button: darkMode 
      ? 'bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08]' 
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200',
    buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  // Loading states
  if (userLoading || isFetching) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center ${theme.bg} ${theme.text}`}>
        <div className="relative">
          <Image src="/pareto-logo.png" alt="Pareto" width={140} height={40} className="animate-pulse" />
        </div>
        <p className={`mt-6 text-sm ${theme.textMuted} animate-pulse`}>Laster inn...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`h-screen flex ${theme.bg} font-[-apple-system,BlinkMacSystemFont,sans-serif]`}>
      {/* Context Menu */}
      {contextMenu && (
        <div 
          className={`fixed z-50 py-1.5 rounded-xl shadow-xl ${darkMode ? 'bg-[#1a1a24] border border-white/10' : 'bg-white border border-gray-200'}`}
          style={{ left: contextMenu.x, top: contextMenu.y, minWidth: '160px' }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => startRenaming(contextMenu.projectId)}
            className={`w-full px-4 py-2 text-left text-sm ${theme.text} ${theme.hover} transition-colors`}
          >
            Endre navn
          </button>
          <button
            onClick={() => deleteProject(contextMenu.projectId)}
            className={`w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors`}
          >
            Slett prosjekt
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-out ${theme.sidebar} border-r ${theme.border} flex flex-col overflow-hidden`}>
        {/* Sidebar Header - Pareto Logo */}
        <div className={`px-4 py-4 border-b ${theme.borderSubtle}`}>
          <Image
            src="/pareto-logo.png"
            alt="Pareto"
            width={90}
            height={26}
            className={darkMode ? 'invert brightness-200' : ''}
          />
        </div>

        {/* New Project Button */}
        <div className="p-3">
          {showNewProject ? (
            <div className="space-y-2.5">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                placeholder="Kundenavn..."
                className={`w-full px-3.5 py-2.5 ${theme.input} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={createProject}
                  className={`flex-1 px-3.5 py-2 ${theme.buttonPrimary} rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25`}
                >
                  Opprett
                </button>
                <button
                  onClick={() => { setShowNewProject(false); setNewProjectName(''); }}
                  className={`px-3.5 py-2 ${theme.button} rounded-xl text-sm transition-all`}
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewProject(true)}
              className={`w-full flex items-center justify-center gap-2 px-3.5 py-3 ${theme.buttonPrimary} rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25`}
            >
              <Plus className="w-4 h-4" />
              Nytt prosjekt
            </button>
          )}
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className={`text-[11px] ${theme.textSubtle} uppercase tracking-wider font-medium mb-2 px-2`}>Prosjekter</p>
          {projects.length === 0 ? (
            <p className={`text-sm ${theme.textMuted} px-2 py-4 text-center`}>Ingen prosjekter ennå</p>
          ) : (
            <div className="space-y-1">
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    activeProjectId === project.id 
                      ? theme.active
                      : theme.hover
                  } ${theme.text}`}
                  onClick={() => renamingProjectId !== project.id && setActiveProjectId(project.id)}
                  onContextMenu={(e) => handleContextMenu(e, project.id)}
                >
                  <FolderOpen className={`w-4 h-4 flex-shrink-0 ${activeProjectId === project.id ? 'text-blue-500' : theme.textMuted}`} />
                  {renamingProjectId === project.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameProject();
                        if (e.key === 'Escape') { setRenamingProjectId(null); setRenameValue(''); }
                      }}
                      onBlur={renameProject}
                      autoFocus
                      className={`flex-1 px-2 py-1 text-[13px] font-medium rounded ${theme.input} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 truncate text-[13px] font-medium">{project.name}</span>
                  )}
                  {project.pareto_documents?.length > 0 && renamingProjectId !== project.id && (
                    <span className={`text-[11px] ${theme.textSubtle} tabular-nums`}>
                      {project.pareto_documents.length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${theme.borderSubtle}`}>
          <div className={`text-[11px] ${theme.textSubtle} text-center mb-3 truncate`}>
            {user.email}
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 ${theme.button} rounded-xl text-[13px] transition-all`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Lys modus' : 'Mørk modus'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={`${theme.header} border-b ${theme.border} px-5 py-3.5 flex items-center gap-4`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 ${theme.hover} rounded-lg transition-all ${theme.text}`}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {activeProject ? (
            <div className="flex-1 min-w-0">
              <h2 className={`font-semibold text-[15px] ${theme.text} truncate`}>{activeProject.name}</h2>
              <p className={`text-[11px] ${theme.textMuted}`}>
                {activeProject.pareto_documents?.length || 0} dokumenter · {(activeProject.pareto_messages?.length || 1) - 1} meldinger
              </p>
            </div>
          ) : (
            <div className="flex-1">
              <h2 className={`font-semibold text-[15px] ${theme.text}`}>Dokumentkontroll</h2>
              <p className={`text-[11px] ${theme.textMuted}`}>Velg eller opprett et prosjekt</p>
            </div>
          )}
        </header>

        {/* Chat Area */}
        {activeProject ? (
          <>
            <main 
              className={`flex-1 overflow-y-auto px-5 py-8 ${theme.chat} relative`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-4 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-2xl flex items-center justify-center z-10 backdrop-blur-sm">
                  <div className="text-center">
                    <Upload className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                    <p className="text-blue-500 font-medium text-sm">Slipp dokumenter her</p>
                  </div>
                </div>
              )}
              <div className="max-w-3xl mx-auto space-y-5">
                {activeProject.pareto_messages?.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? theme.userMsg
                          : theme.assistantMsg
                      }`}
                    >
                      {message.files && message.files.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {message.files.map((file, i) => {
                            const canDownload = uploadedFilesCache.current.has(file.name);
                            return (
                              <button
                                key={i}
                                onClick={() => canDownload && downloadFile(file.name)}
                                disabled={!canDownload}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                  message.role === 'user' 
                                    ? 'bg-white/20 text-white hover:bg-white/30' 
                                    : darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                } ${canDownload ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
                                title={canDownload ? 'Klikk for å laste ned' : 'Fil ikke tilgjengelig for nedlasting'}
                              >
                                <FileText className="w-3 h-3" />
                                <span className="max-w-[150px] truncate">{file.name}</span>
                                {canDownload && <Download className="w-3 h-3 opacity-60" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className={`text-[14px] leading-relaxed prose prose-sm max-w-none ${
                        message.role === 'user' 
                          ? 'prose-invert' 
                          : darkMode ? 'prose-invert' : ''
                      }`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({children}) => (
                              <table className={`border-collapse my-3 text-[12px] w-full rounded-lg overflow-hidden`}>
                                {children}
                              </table>
                            ),
                            th: ({children}) => (
                              <th className={`border px-3 py-2 text-left font-semibold ${
                                darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
                              }`}>
                                {children}
                              </th>
                            ),
                            td: ({children}) => (
                              <td className={`border px-3 py-2 ${
                                darkMode ? 'border-white/10' : 'border-gray-200'
                              }`}>
                                {children}
                              </td>
                            ),
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                            li: ({children}) => <li className="leading-relaxed">{children}</li>,
                            hr: () => <hr className={`my-4 ${darkMode ? 'border-white/10' : 'border-gray-200'}`} />,
                            h2: ({children}) => <h2 className="font-semibold text-[15px] mt-4 mb-2">{children}</h2>,
                            h3: ({children}) => <h3 className="font-semibold text-[14px] mt-3 mb-1.5">{children}</h3>,
                            strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                            code: ({children}) => (
                              <code className={`px-1.5 py-0.5 rounded text-[12px] ${
                                darkMode ? 'bg-white/10' : 'bg-gray-100'
                              }`}>
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Streaming message */}
                {streamingText && (
                  <div className="flex justify-start animate-in fade-in duration-200">
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${theme.assistantMsg}`}>
                      <div className={`text-[14px] leading-relaxed ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        {streamingText}
                        <span className="inline-block w-2 h-4 ml-0.5 bg-blue-500 animate-pulse rounded-sm" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Thinking indicator */}
                {isLoading && !streamingText && (
                  <div className="flex justify-start animate-in fade-in duration-200">
                    <div className={`rounded-2xl px-4 py-3 ${theme.assistantMsg}`}>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className={`text-[13px] ${theme.textMuted}`}>Analyserer...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </main>

            {/* Input Area */}
            <div className={`${theme.inputArea} border-t ${theme.border} p-4`}>
              <div className="max-w-3xl mx-auto">
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {uploadedFiles.map((file, index) => (
                      <span
                        key={index}
                        className={`group inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] ${
                          darkMode ? 'bg-white/5 text-gray-200 border border-white/10' : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="opacity-50 hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.eml"
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 ${theme.button} rounded-xl transition-all`}
                    title="Last opp dokumenter"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                  
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim() || uploadedFiles.length > 0) {
                          handleSubmit(e as any);
                        }
                      }
                    }}
                    placeholder="Skriv en melding..."
                    rows={1}
                    className={`flex-1 px-4 py-3 ${theme.input} rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[14px] resize-none overflow-hidden transition-all`}
                    style={{ minHeight: '48px', maxHeight: '200px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '48px';
                      target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                    }}
                  />
                  
                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                    className={`p-3 ${theme.buttonPrimary} disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
                
                <p className={`text-[11px] ${theme.textSubtle} text-center mt-3`}>
                  Shift + Enter for nytt avsnitt · Høyreklikk prosjekt for å slette
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className={`flex-1 flex items-center justify-center ${theme.chat}`}>
            <div className="text-center max-w-md px-6">
              <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className={`font-semibold text-xl ${theme.text} mb-2`}>Kom i gang</h3>
              <p className={`text-[14px] ${theme.textMuted} mb-6 leading-relaxed`}>
                Opprett et prosjekt og last opp forsikringsdokumenter for kvalitetskontroll.
              </p>
              <button
                onClick={() => { setSidebarOpen(true); setShowNewProject(true); }}
                className={`px-6 py-3 ${theme.buttonPrimary} rounded-xl text-[14px] font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Nytt prosjekt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
