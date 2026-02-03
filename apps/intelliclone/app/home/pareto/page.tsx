'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, Upload, FileText, Loader2, Trash2, 
  Plus, FolderOpen, X, Menu, Moon, Sun
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeProject?.pareto_messages]);

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
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
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
    setInput('');
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
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/pareto/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
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
      
      setUploadedFiles([]);
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

  // Theme classes
  const theme = {
    bg: darkMode ? 'bg-slate-950' : 'bg-slate-100',
    sidebar: darkMode ? 'bg-slate-900' : 'bg-white border-r border-slate-200',
    sidebarText: darkMode ? 'text-white' : 'text-slate-900',
    sidebarMuted: darkMode ? 'text-slate-400' : 'text-slate-500',
    sidebarBorder: darkMode ? 'border-slate-700' : 'border-slate-200',
    sidebarHover: darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100',
    sidebarActive: darkMode ? 'bg-slate-700' : 'bg-blue-50 border border-blue-200',
    input: darkMode ? 'bg-slate-800 border-slate-600' : 'bg-slate-100 border-slate-300',
    header: darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200',
    headerText: darkMode ? 'text-white' : 'text-slate-900',
    chat: darkMode ? 'bg-slate-950' : 'bg-slate-50',
    userMsg: 'bg-blue-600 text-white',
    assistantMsg: darkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white text-slate-800 border-slate-200',
    inputArea: darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200',
    inputField: darkMode ? 'bg-slate-800 text-white placeholder-slate-400' : 'bg-slate-100 text-slate-900 placeholder-slate-500',
    button: darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
  };

  // Loading states
  if (userLoading || isFetching) {
    return (
      <div className={`h-screen flex items-center justify-center ${theme.bg}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`h-screen flex ${theme.bg}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ${theme.sidebar} flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className={`p-4 border-b ${theme.sidebarBorder}`}>
          <div className="flex items-center gap-3">
            <Image
              src="/petter-avatar.jpg"
              alt="Petter"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <h1 className={`font-semibold ${theme.sidebarText}`}>Pareto-Petter</h1>
              <p className={`text-xs ${theme.sidebarMuted}`}>Forsikringskontroll</p>
            </div>
          </div>
        </div>

        {/* New Project Button */}
        <div className="p-3">
          {showNewProject ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                placeholder="Kundenavn..."
                className={`w-full px-3 py-2 ${theme.input} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme.sidebarText}`}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={createProject}
                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  Opprett
                </button>
                <button
                  onClick={() => { setShowNewProject(false); setNewProjectName(''); }}
                  className={`px-3 py-1.5 ${theme.button} rounded-lg text-sm`}
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewProject(true)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 ${theme.button} rounded-lg text-sm font-medium transition-colors`}
            >
              <Plus className="w-4 h-4" />
              Nytt prosjekt
            </button>
          )}
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className={`text-xs ${theme.sidebarMuted} uppercase tracking-wider mb-2 px-2`}>Prosjekter</p>
          {projects.length === 0 ? (
            <p className={`text-sm ${theme.sidebarMuted} px-2`}>Ingen prosjekter ennå</p>
          ) : (
            projects.map(project => (
              <div
                key={project.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  activeProjectId === project.id 
                    ? theme.sidebarActive
                    : theme.sidebarHover
                } ${theme.sidebarText}`}
                onClick={() => setActiveProjectId(project.id)}
              >
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{project.name}</span>
                <span className={`text-xs ${theme.sidebarMuted}`}>{project.pareto_documents?.length || 0}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                  className={`opacity-0 group-hover:opacity-100 p-1 ${theme.sidebarHover} rounded transition-opacity`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${theme.sidebarBorder} space-y-2`}>
          <div className={`text-xs ${theme.sidebarMuted} text-center`}>
            {user.email}
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 ${theme.button} rounded-lg text-sm transition-colors`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Lys modus' : 'Mørk modus'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`${theme.header} border-b px-4 py-3 flex items-center gap-3`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 ${theme.button} rounded-lg transition-colors`}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {activeProject ? (
            <>
              <div className="flex-1">
                <h2 className={`font-semibold ${theme.headerText}`}>{activeProject.name}</h2>
                <p className={`text-xs ${theme.sidebarMuted}`}>
                  {activeProject.pareto_documents?.length || 0} dokumenter · {(activeProject.pareto_messages?.length || 1) - 1} meldinger
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1">
              <h2 className={`font-semibold ${theme.headerText}`}>Pareto-Petter</h2>
              <p className={`text-xs ${theme.sidebarMuted}`}>Velg eller opprett et prosjekt</p>
            </div>
          )}
        </header>

        {/* Chat Area */}
        {activeProject ? (
          <>
            <main 
              className={`flex-1 overflow-y-auto px-4 py-6 ${theme.chat} relative`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-blue-600 font-medium">Slipp dokumenter her</p>
                  </div>
                </div>
              )}
              <div className="max-w-3xl mx-auto space-y-4">
                {activeProject.pareto_messages?.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? theme.userMsg
                          : `${theme.assistantMsg} border shadow-sm`
                      }`}
                    >
                      {message.files && message.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {message.files.map((file, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                message.role === 'user' 
                                  ? 'bg-blue-500 text-white' 
                                  : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              {file.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
                        message.role === 'user' 
                          ? 'prose-invert' 
                          : darkMode ? 'prose-invert' : ''
                      }`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({children}) => (
                              <table className={`border-collapse my-2 text-xs w-full ${
                                darkMode ? 'border-slate-600' : 'border-slate-300'
                              }`}>
                                {children}
                              </table>
                            ),
                            th: ({children}) => (
                              <th className={`border px-2 py-1 text-left font-semibold ${
                                darkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-300 bg-slate-100'
                              }`}>
                                {children}
                              </th>
                            ),
                            td: ({children}) => (
                              <td className={`border px-2 py-1 ${
                                darkMode ? 'border-slate-600' : 'border-slate-300'
                              }`}>
                                {children}
                              </td>
                            ),
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                            li: ({children}) => <li className="mb-1">{children}</li>,
                            hr: () => <hr className={`my-3 ${darkMode ? 'border-slate-600' : 'border-slate-300'}`} />,
                            h2: ({children}) => <h2 className="font-bold text-base mt-3 mb-2">{children}</h2>,
                            h3: ({children}) => <h3 className="font-semibold mt-2 mb-1">{children}</h3>,
                            strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                            code: ({children}) => (
                              <code className={`px-1 rounded text-xs ${
                                darkMode ? 'bg-slate-700' : 'bg-slate-200'
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
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`${theme.assistantMsg} border rounded-2xl px-4 py-3 shadow-sm`}>
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </main>

            {/* Input Area */}
            <div className={`${theme.inputArea} border-t p-4`}>
              <div className="max-w-3xl mx-auto">
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {uploadedFiles.map((file, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                          darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="flex gap-2">
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
                    className={`p-3 ${theme.button} rounded-xl transition-colors`}
                    title="Last opp dokumenter"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                  
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Skriv en melding..."
                    className={`flex-1 px-4 py-3 ${theme.inputField} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                  />
                  
                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 text-white rounded-xl transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className={`flex-1 flex items-center justify-center ${theme.chat}`}>
            <div className="text-center">
              <div className={`w-16 h-16 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <FolderOpen className={`w-8 h-8 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
              </div>
              <h3 className={`font-semibold ${theme.headerText} mb-1`}>Ingen prosjekt valgt</h3>
              <p className={`text-sm ${theme.sidebarMuted} mb-4`}>Opprett et nytt prosjekt for å starte</p>
              <button
                onClick={() => { setSidebarOpen(true); setShowNewProject(true); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
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
