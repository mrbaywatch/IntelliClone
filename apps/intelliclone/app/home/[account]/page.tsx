'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    content: 'Hello! I\'m your IntelliClone AI assistant. How can I help you today?',
    role: 'assistant',
    timestamp: new Date(),
  },
];

export default function ChatDashboard() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const responses = [
        'That\'s a great question! Let me help you with that.',
        'I understand. Here\'s what I can tell you...',
        'Interesting! I\'d be happy to assist.',
        'Thanks for sharing. Let me provide some insights.',
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)] ?? responses[0];
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white p-4 md:p-8">
      {/* Floating Chat Card */}
      <div className="flex h-[700px] w-full max-w-[800px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_60px_-12px_rgba(0,0,0,0.12)]">
        {/* Minimal Header */}
        <div className="flex items-center justify-center gap-2.5 border-b border-gray-100 px-6 py-5">
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: '#D4A84B' }}
          >
            <Bot className="h-4.5 w-4.5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">IntelliClone AI</h1>
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
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    message.role === 'user'
                      ? 'bg-gray-100'
                      : ''
                  }`}
                  style={message.role === 'assistant' ? { backgroundColor: '#D4A84B' } : {}}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>

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
                <div 
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#D4A84B' }}
                >
                  <Bot className="h-4 w-4 text-white" />
                </div>
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
    </div>
  );
}
