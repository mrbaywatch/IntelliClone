'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageSquarePlus, 
  Send, 
  User, 
  Bot, 
  Clock, 
  Sparkles,
  Brain,
  Lightbulb,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@kit/ui/utils';
import { MarkdownRenderer } from '@kit/ui/markdown-renderer';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages: Message[];
}

interface LearnedFact {
  id: string;
  fact: string;
  category: 'preference' | 'info' | 'context';
}

// Mock data for demonstration
const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Product pricing questions',
    preview: 'What are the different pricing tiers...',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    messages: [
      { id: '1a', role: 'user', content: 'What are the different pricing tiers for your product?', timestamp: new Date(Date.now() - 1000 * 60 * 35) },
      { id: '1b', role: 'assistant', content: 'We offer three pricing tiers:\n\n**Starter** - $29/month\n- Up to 1,000 conversations\n- Basic analytics\n- Email support\n\n**Pro** - $79/month\n- Up to 10,000 conversations\n- Advanced analytics\n- Priority support\n\n**Enterprise** - Custom pricing\n- Unlimited conversations\n- Custom integrations\n- Dedicated support', timestamp: new Date(Date.now() - 1000 * 60 * 34) },
    ]
  },
  {
    id: '2',
    title: 'Integration help',
    preview: 'How do I integrate with Shopify...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    messages: [
      { id: '2a', role: 'user', content: 'How do I integrate with Shopify?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
      { id: '2b', role: 'assistant', content: 'Integrating with Shopify is simple! Just follow these steps:\n\n1. Go to your Shopify admin panel\n2. Navigate to Settings > Apps\n3. Search for our app\n4. Click Install and follow the prompts\n\nNeed more help? I\'m here to assist!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 30000) },
    ]
  },
  {
    id: '3',
    title: 'Feature request',
    preview: 'Can the chatbot handle multiple languages...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    messages: []
  },
];

const mockLearnedFacts: LearnedFact[] = [
  { id: '1', fact: 'Prefers detailed explanations', category: 'preference' },
  { id: '2', fact: 'Uses Shopify for e-commerce', category: 'info' },
  { id: '3', fact: 'Interested in Pro tier features', category: 'context' },
];

const suggestedActions = [
  'Tell me about advanced features',
  'How do I customize the chatbot?',
  'What analytics are available?',
];

// Utility functions
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function ChatDashboard() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(mockConversations[0] ?? null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [learnedFacts] = useState<LearnedFact[]>(mockLearnedFacts);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, scrollToBottom]);

  const handleNewChat = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: 'New conversation',
      preview: '',
      timestamp: new Date(),
      messages: [],
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation);
    setInputValue('');
    setLeftSidebarOpen(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversation || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    const newTitle = activeConversation.messages.length === 0 
      ? inputValue.trim().substring(0, 30) + (inputValue.length > 30 ? '...' : '')
      : activeConversation.title;

    // Update conversation with user message
    const updatedConversation: Conversation = {
      ...activeConversation,
      messages: [...activeConversation.messages, userMessage],
      preview: inputValue.trim().substring(0, 40) + '...',
      title: newTitle,
    };

    setActiveConversation(updatedConversation);
    setConversations(conversations.map(c => 
      c.id === activeConversation.id ? updatedConversation : c
    ));
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Thank you for your message! I\'m here to help you with any questions about our platform. This is a demo response - in production, this would be connected to your AI backend.',
        timestamp: new Date(),
      };

      const finalConversation: Conversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage],
      };

      setActiveConversation(finalConversation);
      setConversations(prev => prev.map(c => 
        c.id === activeConversation.id ? finalConversation : c
      ));
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedAction = (action: string) => {
    setInputValue(action);
    setRightSidebarOpen(false);
    inputRef.current?.focus();
  };

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = conversations.filter(c => c.id !== conversationId);
    setConversations(filtered);
    if (activeConversation?.id === conversationId) {
      setActiveConversation(filtered[0] ?? null);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    setLeftSidebarOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white px-4 py-3 border-b border-gray-100 lg:hidden">
        <button
          onClick={() => setLeftSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-medium text-gray-900">
          {activeConversation?.title || 'Chat'}
        </span>
        <button
          onClick={() => setRightSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Brain className="w-5 h-5" style={{ color: '#D4A84B' }} />
        </button>
      </div>

      {/* Left Sidebar Overlay (Mobile) */}
      {leftSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setLeftSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Conversation History */}
      <aside className={cn(
        "fixed lg:relative w-72 h-full border-r border-gray-100 flex flex-col bg-gray-50/50 z-50 transition-transform lg:translate-x-0",
        leftSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-semibold text-gray-900">Conversations</span>
          <button
            onClick={() => setLeftSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 pt-0 lg:pt-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: '#D4A84B' }}
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-2 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Recent Conversations
          </p>
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={cn(
                  'group relative p-3 rounded-xl cursor-pointer transition-all',
                  activeConversation?.id === conversation.id
                    ? 'bg-white shadow-sm border border-amber-200/50'
                    : 'hover:bg-white/70'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      'text-sm font-medium truncate',
                      activeConversation?.id === conversation.id 
                        ? 'text-gray-900' 
                        : 'text-gray-700'
                    )}>
                      {conversation.title}
                    </h3>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {conversation.preview || 'No messages yet'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(conversation.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Center - Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        {activeConversation ? (
          <>
            {/* Chat Header (Desktop) */}
            <header className="hidden lg:block px-6 py-4 border-b border-gray-100 bg-white">
              <h1 className="text-lg font-semibold text-gray-900">
                {activeConversation.title}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {activeConversation.messages.length} messages
              </p>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6">
              {activeConversation.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: '#D4A84B20' }}
                  >
                    <Sparkles className="w-8 h-8" style={{ color: '#D4A84B' }} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Start a conversation
                  </h2>
                  <p className="text-gray-500 max-w-sm">
                    Ask me anything about your customers, products, or how I can help you today.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {activeConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#D4A84B' }}
                        >
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[80%] lg:max-w-[70%] px-4 py-3 rounded-2xl',
                          message.role === 'user'
                            ? 'bg-gray-100 text-gray-900 rounded-tr-md'
                            : 'bg-amber-50 border border-amber-100 rounded-tl-md'
                        )}
                      >
                        <MarkdownRenderer className="prose prose-sm prose-gray max-w-none">
                          {message.content}
                        </MarkdownRenderer>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatRelativeTime(message.timestamp)}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#D4A84B' }}
                      >
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-amber-50 border border-amber-100 px-4 py-3 rounded-2xl rounded-tl-md">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="px-4 lg:px-6 py-4 border-t border-gray-100 bg-white">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className={cn(
                        'absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all',
                        inputValue.trim() && !isLoading
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-400'
                      )}
                      style={inputValue.trim() && !isLoading ? { backgroundColor: '#D4A84B' } : {}}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#D4A84B20' }}
              >
                <MessageSquarePlus className="w-8 h-8" style={{ color: '#D4A84B' }} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No conversation selected
              </h2>
              <p className="text-gray-500 mb-4">
                Start a new chat to begin
              </p>
              <button
                onClick={handleNewChat}
                className="px-6 py-2 rounded-xl text-white font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#D4A84B' }}
              >
                New Chat
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar Overlay (Mobile) */}
      {rightSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setRightSidebarOpen(false)}
        />
      )}

      {/* Right Sidebar - AI Memory & Context */}
      <aside className={cn(
        "fixed lg:relative right-0 w-80 h-full border-l border-gray-100 flex flex-col bg-gray-50/30 z-50 transition-transform lg:translate-x-0",
        rightSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        "hidden lg:flex"
      )}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" style={{ color: '#D4A84B' }} />
              <h2 className="font-semibold text-gray-900">AI Memory</h2>
            </div>
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Facts learned from this conversation
          </p>
        </div>

        {/* Learned Facts */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {learnedFacts.map((fact) => (
              <div
                key={fact.id}
                className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <div 
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#D4A84B20' }}
                  >
                    {fact.category === 'preference' && <User className="w-3 h-3" style={{ color: '#D4A84B' }} />}
                    {fact.category === 'info' && <Lightbulb className="w-3 h-3" style={{ color: '#D4A84B' }} />}
                    {fact.category === 'context' && <MoreHorizontal className="w-3 h-3" style={{ color: '#D4A84B' }} />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{fact.fact}</p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">{fact.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Actions */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: '#D4A84B' }} />
              <h3 className="text-sm font-medium text-gray-700">Suggested Actions</h3>
            </div>
            <div className="space-y-2">
              {suggestedActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedAction(action)}
                  className="w-full p-3 text-left text-sm bg-white rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{action}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Info Footer */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Guest User</p>
              <p className="text-xs text-gray-400">No customer data yet</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Right Sidebar (shown when open) */}
      <aside className={cn(
        "fixed right-0 w-80 h-full border-l border-gray-100 flex flex-col bg-white z-50 transition-transform lg:hidden",
        rightSidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" style={{ color: '#D4A84B' }} />
              <h2 className="font-semibold text-gray-900">AI Memory</h2>
            </div>
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Facts learned from this conversation
          </p>
        </div>

        {/* Learned Facts */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {learnedFacts.map((fact) => (
              <div
                key={fact.id}
                className="p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="flex items-start gap-2">
                  <div 
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: '#D4A84B20' }}
                  >
                    {fact.category === 'preference' && <User className="w-3 h-3" style={{ color: '#D4A84B' }} />}
                    {fact.category === 'info' && <Lightbulb className="w-3 h-3" style={{ color: '#D4A84B' }} />}
                    {fact.category === 'context' && <MoreHorizontal className="w-3 h-3" style={{ color: '#D4A84B' }} />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{fact.fact}</p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">{fact.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Actions */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: '#D4A84B' }} />
              <h3 className="text-sm font-medium text-gray-700">Suggested Actions</h3>
            </div>
            <div className="space-y-2">
              {suggestedActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedAction(action)}
                  className="w-full p-3 text-left text-sm bg-gray-50 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">{action}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Info Footer */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Guest User</p>
              <p className="text-xs text-gray-400">No customer data yet</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
