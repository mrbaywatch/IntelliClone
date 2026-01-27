'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Send, User, Plus, MessageSquare, Menu, X, Trash2, Brain } from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

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
    const lastUserMessage = [...session.messages].reverse().find(m => m.role === 'user');
    return lastUserMessage?.content.slice(0, 40) || 'No messages yet';
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-white">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 z-50 h-full w-[280px] transform border-r border-gray-100 bg-gray-50/80 backdrop-blur-xl transition-transform duration-300 ease-in-out md:relative md:z-auto md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <h2 className="text-sm font-semibold text-gray-700">Chats</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={handleNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          {/* Memory Link */}
          <div className="px-3">
            <Link
              href="/home/memories"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-white/60"
            >
              <Brain className="h-4 w-4" style={{ color: '#D4A84B' }} />
              Memory
            </Link>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            <div className="flex flex-col gap-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  onContextMenu={(e) => handleContextMenu(e, session.id)}
                  className={`group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                    session.id === activeSessionId
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-white/60'
                  }`}
                  style={session.id === activeSessionId ? { 
                    borderLeft: '3px solid #D4A84B',
                    marginLeft: '-3px',
                    paddingLeft: 'calc(0.75rem + 3px)'
                  } : {}}
                >
                  <MessageSquare 
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                      session.id === activeSessionId ? '' : 'text-gray-400'
                    }`}
                    style={session.id === activeSessionId ? { color: '#D4A84B' } : {}}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${
                      session.id === activeSessionId ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {session.title}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {getSessionPreview(session)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-1 items-center justify-center p-4 md:p-8">
        {/* Floating Chat Card */}
        <div className="flex h-[700px] w-full max-w-[800px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_60px_-12px_rgba(0,0,0,0.12)]">
          {/* Minimal Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-5 md:px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-center gap-2.5 md:flex-1">
              <Image
                src="/images/erik-avatar.png"
                alt="Erik"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
              <h1 className="text-lg font-semibold text-gray-900">Erik</h1>
            </div>

            {/* Spacer for alignment */}
            <div className="w-8 md:hidden" />
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="flex flex-col gap-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2.5 ${
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
                      className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                    />
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'rounded-br-lg bg-gray-100 text-gray-900'
                        : 'rounded-bl-lg text-gray-900'
                    }`}
                    style={message.role === 'assistant' ? { backgroundColor: '#D4A84B15' } : {}}
                  >
                    <p className="text-[15px] leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-end gap-2.5">
                  <Image
                    src="/images/erik-avatar.png"
                    alt="Erik"
                    width={32}
                    height={32}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                  />
                  <div 
                    className="rounded-2xl rounded-bl-lg px-4 py-4"
                    style={{ backgroundColor: '#D4A84B15' }}
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
          <div className="border-t border-gray-100 px-5 py-5">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 transition-all focus-within:border-amber-300 focus-within:bg-white focus-within:shadow-sm">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message..."
                className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder-gray-400 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:opacity-90 disabled:opacity-30"
                style={{ backgroundColor: '#D4A84B' }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
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
