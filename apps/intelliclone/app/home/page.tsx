'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { User, Plus, Menu, X, Trash2 } from 'lucide-react';

import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { useLanguage } from '~/lib/language-context';

interface MessageImage {
  name: string;
  url: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  images?: MessageImage[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  sessionId: string | null;
}

const createNewSession = (): ChatSession => ({
  id: Date.now().toString(),
  title: 'New Chat',
  messages: [],
  createdAt: new Date(),
});

const ChatIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
  </svg>
);

export default function ChatDashboard() {
  const [sessions, setSessions] = useState<ChatSession[]>([createNewSession()]);
  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0].id);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    sessionId: null,
  });
  const { language } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;
  const isEmptyChat = messages.length === 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate preview URLs for image files
  useEffect(() => {
    const urls = pendingFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    });
    setFilePreviewUrls(urls);
    
    // Cleanup URLs on unmount
    return () => {
      urls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [pendingFiles]);

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files]);
    }
  }, []);

  // Paste handler for clipboard images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            // Create a named file from clipboard
            const namedFile = new File([file], `screenshot-${Date.now()}.png`, { type: file.type });
            imageFiles.push(namedFile);
          }
        }
      }
      
      if (imageFiles.length > 0) {
        e.preventDefault();
        setPendingFiles(prev => [...prev, ...imageFiles]);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const removeFile = (index: number) => {
    setPendingFiles(files => files.filter((_, i) => i !== index));
  };

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu.visible, closeContextMenu]);

  const handleContextMenu = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      sessionId,
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    closeContextMenu();
    
    if (sessions.length === 1) {
      const newSession = createNewSession();
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      return;
    }

    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);

    if (sessionId === activeSessionId) {
      const newActiveIndex = Math.min(sessionIndex, newSessions.length - 1);
      setActiveSessionId(newSessions[newActiveIndex].id);
    }
  };

  const updateSessionMessages = (sessionId: string, newMessages: Message[], newTitle?: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id !== sessionId) return session;
      
      // Use provided title, or keep existing if not 'New Chat', or generate placeholder
      const title = newTitle || (session.title !== 'New Chat' ? session.title : 
        (newMessages.find(m => m.role === 'user')?.content.slice(0, 30) + '...' || 'New Chat'));
      
      return { ...session, messages: newMessages, title };
    }));
  };

  const generateTitle = async (messages: Message[]): Promise<string> => {
    try {
      const response = await fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(0, 4).map(m => ({ role: m.role, content: m.content })),
          language,
        }),
      });
      const data = await response.json();
      return data.title || 'New Chat';
    } catch {
      return 'New Chat';
    }
  };

  const handleNewChat = () => {
    const newSession = createNewSession();
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setSidebarOpen(false);
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setSidebarOpen(false);
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && pendingFiles.length === 0) return;

    let fileContent = '';
    const messageImages: MessageImage[] = [];
    
    for (const file of pendingFiles) {
      try {
        if (file.type.startsWith('image/')) {
          // Create a persistent URL for the image
          const url = URL.createObjectURL(file);
          messageImages.push({ name: file.name, url });
          fileContent += `[Image: ${file.name}]\n`;
        } else {
          const text = await file.text();
          fileContent += `[File: ${file.name}]\n\`\`\`\n${text}\n\`\`\`\n\n`;
        }
      } catch (err) {
        console.error('Error reading file:', file.name, err);
      }
    }

    const fullContent = (trimmedInput + (fileContent ? '\n' + fileContent : '')).trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      content: fullContent,
      role: 'user',
      timestamp: new Date(),
      images: messageImages.length > 0 ? messageImages : undefined,
    };

    const updatedMessages = [...messages, userMessage];
    updateSessionMessages(activeSessionId, updatedMessages);
    setInput('');
    setPendingFiles([]);
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          language,
        }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || 'Sorry, I could not generate a response.',
        role: 'assistant',
        timestamp: new Date(),
      };
      
      const allMessages = [...updatedMessages, aiMessage];
      updateSessionMessages(activeSessionId, allMessages);
      
      // Generate title after first exchange (1 user + 1 assistant message)
      if (allMessages.length === 2) {
        generateTitle(allMessages).then(title => {
          updateSessionMessages(activeSessionId, allMessages, title);
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, something went wrong. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      updateSessionMessages(activeSessionId, [...updatedMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSessionPreview = (session: ChatSession) => {
    if (session.messages.length === 0) return language === 'no' ? 'Tom chat' : 'Empty chat';
    const lastMsg = session.messages[session.messages.length - 1];
    return lastMsg?.content.slice(0, 35) + '...' || 'No messages yet';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#212121]">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 z-50 h-screen w-[280px] transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-[#171717] md:relative md:z-auto md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="border-b border-gray-200 px-5 py-5 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: 'linear-gradient(to bottom right, #D4A84B, #B8923F)' }}
                >
                  <ChatIcon className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Intelli<span style={{ color: '#D4A84B' }}>Clone</span>
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300 md:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" />
              {language === 'no' ? 'Ny chat' : 'New Chat'}
            </button>
          </div>

          {/* Sessions Label */}
          <div className="px-6 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{language === 'no' ? 'Nylige samtaler' : 'Recent Chats'}</span>
          </div>

          {/* Session List */}
          <div className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  onContextMenu={(e) => handleContextMenu(e, session.id)}
                  className={`relative flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                    isActive
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {isActive && (
                    <div 
                      className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-sm"
                      style={{ background: '#D4A84B' }}
                    />
                  )}
                  <ChatIcon 
                    className="mt-0.5 h-5 w-5 flex-shrink-0"
                    style={{ color: isActive ? '#D4A84B' : '#9CA3AF' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {session.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                      {getSessionPreview(session)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* User Profile Section */}
          <div className="mt-auto border-t border-gray-200 p-4 dark:border-gray-800">
            <ProfileAccountDropdownContainer showProfileName={true} />
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main 
        className={`flex flex-1 flex-col relative ${isDragging ? 'ring-2 ring-inset ring-amber-500/50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
            <div className="rounded-2xl border-2 border-dashed border-amber-500 bg-gray-800/90 px-8 py-6 text-center">
              <p className="text-lg font-medium text-white">Drop files here</p>
              <p className="text-sm text-gray-400">Images, documents, and more</p>
            </div>
          </div>
        )}
        
        {/* Mobile Header */}
        <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-[#212121] md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <span className="font-semibold" style={{ color: '#D4A84B' }}>Erik</span>
            <div className="w-9" />
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex flex-1 flex-col">
          
          {/* Empty State - ChatGPT Style */}
          {isEmptyChat && !isTyping ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4">
              <Image
                src="/images/erik-avatar.png"
                alt="Erik"
                width={80}
                height={80}
                className="mb-4 h-20 w-20 rounded-full object-cover shadow-lg"
              />
              <h1 className="mb-8 text-3xl font-medium text-gray-800 dark:text-gray-200">
                {language === 'no' ? 'Hei sjef, hvordan kan jeg hjelpe deg?' : 'How can I help you today, boss?'}
              </h1>
              
              {/* Input in center */}
              <div className="w-full max-w-2xl">
                {/* File previews for empty state */}
                {pendingFiles.length > 0 && (
                  <div className="mb-3 flex flex-wrap justify-center gap-2">
                    {pendingFiles.map((file, index) => (
                      <div key={index} className="group relative">
                        {file.type.startsWith('image/') && filePreviewUrls[index] ? (
                          <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                            <img src={filePreviewUrls[index]} alt={file.name} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <Trash2 className="h-5 w-5 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-16 items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-gray-300 focus-within:shadow-md dark:border-gray-700 dark:bg-[#2F2F2F] dark:focus-within:border-gray-600">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        setPendingFiles(prev => [...prev, ...files]);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                    accept="*/*"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    title="Attach files"
                  >
                    <Plus className="h-5 w-5" />
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={language === 'no' ? 'Spør om hva som helst' : 'Ask anything'}
                    rows={1}
                    className="max-h-[150px] min-h-[24px] flex-1 resize-none bg-transparent text-[15px] leading-6 text-gray-800 placeholder-gray-400 outline-none dark:text-gray-100 dark:placeholder-gray-500"
                  />
                  
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() && pendingFiles.length === 0}
                    className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-white transition-all hover:bg-gray-800 disabled:opacity-30 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                  >
                    <SendIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
                <div className="mx-auto flex max-w-3xl flex-col gap-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-4 ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                          <User className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                        </div>
                      ) : (
                        <Image
                          src="/images/erik-avatar.png"
                          alt="Erik"
                          width={32}
                          height={32}
                          className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                        />
                      )}

                      <div
                        className={`max-w-[80%] ${
                          message.role === 'user'
                            ? 'rounded-2xl bg-gray-100 px-4 py-3 text-gray-800 dark:bg-[#2F2F2F] dark:text-gray-100'
                            : 'text-gray-800 dark:text-gray-100'
                        }`}
                      >
                        {/* Image previews */}
                        {message.images && message.images.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {message.images.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => setLightboxImage(img.url)}
                                className="relative overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
                              >
                                <img
                                  src={img.url}
                                  alt={img.name}
                                  className="h-32 max-w-[200px] object-cover rounded-lg"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                        {/* Text content - filter out [Image: ...] tags */}
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                          {message.content.replace(/\[Image: [^\]]+\]\n?/g, '').trim()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-start gap-4">
                      <Image
                        src="/images/erik-avatar.png"
                        alt="Erik"
                        width={32}
                        height={32}
                        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                      />
                      <div className="flex gap-1.5 py-3">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area - Bottom */}
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-[#171717] md:px-8">
                <div className="mx-auto max-w-3xl">
                  {pendingFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {pendingFiles.map((file, index) => (
                        <div
                          key={index}
                          className="group relative"
                        >
                          {file.type.startsWith('image/') && filePreviewUrls[index] ? (
                            <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                              <img
                                src={filePreviewUrls[index]}
                                alt={file.name}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Trash2 className="h-5 w-5 text-white" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex h-20 items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 dark:border-gray-700 dark:bg-gray-800">
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 opacity-0 transition-opacity hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-gray-300 focus-within:shadow-md dark:border-gray-700 dark:bg-[#2F2F2F] dark:focus-within:border-gray-600">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      title="Attach files"
                    >
                      <Plus className="h-5 w-5" />
                    </button>

                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={language === 'no' ? 'Spør om hva som helst' : 'Ask anything'}
                      rows={1}
                      className="max-h-[150px] min-h-[24px] flex-1 resize-none bg-transparent text-[15px] leading-6 text-gray-800 placeholder-gray-400 outline-none dark:text-gray-100 dark:placeholder-gray-500"
                    />
                    
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() && pendingFiles.length === 0}
                      className="mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-white transition-all hover:bg-gray-800 disabled:opacity-30 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                    >
                      <SendIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.sessionId && (
        <div
          ref={contextMenuRef}
          className="fixed z-[100] min-w-[140px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={() => handleDeleteSession(contextMenu.sessionId!)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            {language === 'no' ? 'Slett' : 'Delete'}
          </button>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
