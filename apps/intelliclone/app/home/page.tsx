'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, Plus, Menu, X, Trash2, Settings, LogOut, ChevronUp } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
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

const createInitialMessage = (): Message => ({
  id: '1',
  content: 'Hey! 👋 I\'m Erik, your personal assistant. Let\'s get you onboarded!\n\nFirst off, what\'s your name?',
  role: 'assistant',
  timestamp: new Date(),
});

const createNewSession = (): ChatSession => ({
  id: Date.now().toString(),
  title: 'New Chat',
  messages: [createInitialMessage()],
  createdAt: new Date(),
});

// Chat bubble icon SVG
const ChatIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
  </svg>
);

// Brain icon for memory
const BrainIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
  </svg>
);

// Send icon
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
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    sessionId: null,
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close context menu on click outside or Escape key
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
        setProfileMenuOpen(false);
      }
    };

    if (contextMenu.visible || profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu.visible, profileMenuOpen, closeContextMenu]);

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
    
    // If this is the only session, create a new one first
    if (sessions.length === 1) {
      const newSession = createNewSession();
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      return;
    }

    // Find the index of the session to delete
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);

    // If deleting the active session, switch to another
    if (sessionId === activeSessionId) {
      // Prefer the next session, or the previous if at the end
      const newActiveIndex = Math.min(sessionIndex, newSessions.length - 1);
      setActiveSessionId(newSessions[newActiveIndex].id);
    }
  };

  const updateSessionMessages = (sessionId: string, newMessages: Message[]) => {
    setSessions(prev => prev.map(session => {
      if (session.id !== sessionId) return session;
      
      // Auto-generate title from first user message
      const firstUserMsg = newMessages.find(m => m.role === 'user');
      const title = firstUserMsg 
        ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
        : 'New Chat';
      
      return { ...session, messages: newMessages, title };
    }));
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
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    updateSessionMessages(activeSessionId, updatedMessages);
    setInput('');
    setIsTyping(true);

    // Call ChatGPT API
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || 'Sorry, I could not generate a response.',
        role: 'assistant',
        timestamp: new Date(),
      };
      
      updateSessionMessages(activeSessionId, [...updatedMessages, aiMessage]);
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
    const lastMsg = session.messages[session.messages.length - 1];
    return lastMsg?.content.slice(0, 35) + '...' || 'No messages yet';
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Frosted Glass */}
      <aside 
        className={`fixed left-0 top-0 z-50 h-screen w-[280px] transform border-r border-gray-100/50 transition-transform duration-300 ease-in-out md:relative md:z-auto md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header with Logo */}
          <div className="border-b border-gray-100/50 px-5 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo Icon */}
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-xl shadow-sm"
                  style={{ background: 'linear-gradient(to bottom right, #D4A84B, #B8923F)' }}
                >
                  <ChatIcon className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-800">
                  Intelli<span style={{ color: '#D4A84B' }}>Clone</span>
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 md:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-gray-200/80 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_4px_40px_-8px_rgba(0,0,0,0.08)]"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          {/* Memory Link */}
          <div className="mb-2 px-4">
            <Link
              href="/home/memories"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-gray-600 transition-all hover:bg-white/60"
            >
              <BrainIcon className="h-5 w-5" style={{ color: '#D4A84B' }} />
              <span className="text-sm font-medium">Memory</span>
            </Link>
          </div>

          {/* Sessions Label */}
          <div className="px-6 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Recent Chats</span>
          </div>

          {/* Session List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  onContextMenu={(e) => handleContextMenu(e, session.id)}
                  className={`relative flex w-full items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-all ${
                    isActive
                      ? 'bg-white shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)]'
                      : 'hover:bg-white/70'
                  }`}
                >
                  {/* Active indicator */}
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
                    <p className={`truncate text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                      {session.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {getSessionPreview(session)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* User Profile Section - Fixed to bottom */}
          <div className="relative mt-auto border-t border-gray-100/50 p-4" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition-all hover:bg-white/60"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-gray-800">Johannes</p>
                <p className="truncate text-xs text-gray-400">Personal Account</p>
              </div>
              <ChevronUp className={`h-4 w-4 text-gray-400 transition-transform ${profileMenuOpen ? '' : 'rotate-180'}`} />
            </button>

            {/* Profile Popup Menu */}
            {profileMenuOpen && (
              <div 
                className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-2xl bg-white shadow-[0_4px_40px_-8px_rgba(0,0,0,0.15)]"
              >
                <Link
                  href="/home/settings"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Settings</span>
                </Link>
                <div className="border-t border-gray-100" />
                <Link
                  href="/auth/sign-out"
                  className="flex items-center gap-3 px-4 py-3 text-red-600 transition-colors hover:bg-red-50"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-1 items-center justify-center p-4 md:p-8">
        
        {/* Mobile Header (Fixed) */}
        <div 
          className="fixed left-0 right-0 top-0 z-40 border-b border-gray-100/50 md:hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 transition-colors hover:bg-gray-100/50"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Image
                src="/images/erik-avatar.png"
                alt="Erik"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="font-semibold" style={{ color: '#D4A84B' }}>Erik</span>
            </div>
            <div className="w-9" />
          </div>
        </div>

        {/* Floating Chat Card */}
        <div 
          className="mt-16 flex h-[calc(100vh-6rem)] w-full max-w-[850px] flex-col overflow-hidden bg-white md:mt-0 md:h-[720px]"
          style={{
            borderRadius: '2rem',
            boxShadow: '0 8px 60px -12px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-gray-100/50 px-6 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <Image
                  src="/images/erik-avatar.png"
                  alt="Erik"
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover shadow-sm"
                />
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div>
                <h1 className="font-semibold" style={{ color: '#D4A84B' }}>Erik</h1>
                <p className="text-xs text-gray-400">Your personal assistant</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
            <div className="flex flex-col gap-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  {message.role === 'user' ? (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  ) : (
                    <Image
                      src="/images/erik-avatar.png"
                      alt="Erik"
                      width={32}
                      height={32}
                      className="h-8 w-8 flex-shrink-0 rounded-full object-cover shadow-sm"
                    />
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[75%] px-5 py-3.5 ${
                      message.role === 'user'
                        ? 'rounded-3xl rounded-br-lg bg-gray-100 text-gray-800'
                        : 'rounded-3xl rounded-bl-lg border text-gray-800'
                    }`}
                    style={message.role === 'assistant' ? { 
                      background: 'linear-gradient(135deg, rgba(212, 168, 75, 0.06) 0%, rgba(212, 168, 75, 0.03) 100%)',
                      borderColor: 'rgba(212, 168, 75, 0.15)',
                    } : {}}
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-end gap-3">
                  <Image
                    src="/images/erik-avatar.png"
                    alt="Erik"
                    width={32}
                    height={32}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover shadow-sm"
                  />
                  <div 
                    className="rounded-3xl rounded-bl-lg border px-5 py-4"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(212, 168, 75, 0.06) 0%, rgba(212, 168, 75, 0.03) 100%)',
                      borderColor: 'rgba(212, 168, 75, 0.15)',
                    }}
                  >
                    <div className="flex gap-1.5">
                      <span 
                        className="h-2 w-2 animate-bounce rounded-full"
                        style={{ backgroundColor: '#D4A84B', animationDelay: '0ms' }}
                      />
                      <span 
                        className="h-2 w-2 animate-bounce rounded-full"
                        style={{ backgroundColor: '#D4A84B', animationDelay: '150ms' }}
                      />
                      <span 
                        className="h-2 w-2 animate-bounce rounded-full"
                        style={{ backgroundColor: '#D4A84B', animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100/50 bg-gray-50/30 px-6 py-5 md:px-8">
            <div 
              className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-5 py-3 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] transition-all focus-within:border-[#D4A84B]/40 focus-within:shadow-[0_4px_40px_-8px_rgba(0,0,0,0.08)] focus-within:ring-2 focus-within:ring-[#D4A84B]/10"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message Erik..."
                className="flex-1 bg-transparent text-[15px] text-gray-800 placeholder-gray-400 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-30 disabled:hover:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #D4A84B 0%, #B8923F 100%)' }}
              >
                <SendIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-gray-400">
              Erik can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.sessionId && (
        <div
          ref={contextMenuRef}
          className="fixed z-[100] min-w-[140px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={() => handleDeleteSession(contextMenu.sessionId!)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
