'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { Paperclip, RefreshCcw, Send, X } from 'lucide-react';

import { If } from '@kit/ui/if';
import { MarkdownRenderer } from '@kit/ui/markdown-renderer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';
import { cn } from '@kit/ui/utils';

import { ChatbotBubble } from './chatbot-bubble';
import { ChatbotContext } from './chatbot-context';
import { chatBotMessagesStore } from './lib/chatbot-messages-store';
import { ChatBotMessageRole } from './lib/message-role.enum';

const NEXT_PUBLIC_CHATBOT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL;

if (!NEXT_PUBLIC_CHATBOT_API_URL) {
  throw new Error(
    `The environment variable NEXT_PUBLIC_CHATBOT_API_URL is not set`,
  );
}

type ChatBotProps = React.PropsWithChildren<{
  siteName: string;
  chatbotId: string;

  defaultPrompts?: string[];
  storageKey?: string;
  conversationId?: string;

  onClear?: () => void;
  onMessage?: (message: string) => void;
}>;

export function ChatbotContainer(props: ChatBotProps) {
  const { state, onOpenChange, onLoadingChange } = useContext(ChatbotContext);
  const scrollingDiv = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useScrollToBottom(scrollingDiv);

  const [error, setError] = useState<string | undefined>(undefined);

  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: NEXT_PUBLIC_CHATBOT_API_URL,
      headers: {
        'x-chatbot-id': props.chatbotId,
        'x-conversation-id': props.conversationId ?? '',
      },
    }),
    messages: chatBotMessagesStore.loadMessages(
      props.storageKey,
      props.siteName,
    ),
    onError: (error) => {
      setError('Sorry, we could not process your request. Please try again.');
      onLoadingChange(false);
      console.error(error);
    },
    onFinish: ({ message }) => {
      onLoadingChange(false);
      setError(undefined);

      if (props.onMessage) {
        const textPart = message.parts?.find((part) => part.type === 'text');

        const messageContent =
          textPart && 'text' in textPart ? textPart.text : '';

        props.onMessage(messageContent);
      }
    },
  });

  // Use built-in loading state from context for now
  const isLoading = status === 'streaming';

  useEffect(() => {
    scrollToBottom({ smooth: true });

    chatBotMessagesStore.saveMessages(messages, props.storageKey);
  }, [messages, scrollToBottom, props.storageKey]);

  return (
    <>
      <If condition={state.isOpen}>
        <ChatbotContentContainer position={state.settings.position}>
          <div className={'flex h-full flex-col'}>
            <ChatBotHeader
              onClose={() => onOpenChange(false)}
              onRefresh={() => {
                chatBotMessagesStore.removeMessages(props.storageKey);

                setMessages(
                  chatBotMessagesStore.loadMessages(
                    props.storageKey,
                    props.siteName,
                  ),
                );

                if (props.onClear) {
                  props.onClear();
                }
              }}
            />

            <div
              ref={(div) => {
                scrollingDiv.current = div;
              }}
              className={'flex flex-1 flex-col overflow-y-auto'}
            >
              <ChatBotMessages
                isLoading={state.isLoading}
                messages={messages}
                defaultPrompts={props.defaultPrompts}
                onPromptClick={(content) => {
                  onLoadingChange(true);

                  return sendMessage({
                    role: ChatBotMessageRole.User,
                    parts: [{ type: 'text', text: content }],
                  });
                }}
              />
            </div>

            <If condition={error}>
              <div className={'p-4'}>
                <span className={'text-xs text-red-500'}>{error}</span>
              </div>
            </If>

            {/* Pending files display */}
            <If condition={pendingFiles.length > 0}>
              <div className="border-t px-4 py-2 flex flex-wrap gap-2">
                {pendingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs"
                  >
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFiles((files) =>
                          files.filter((_, i) => i !== index)
                        );
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </If>

            <ChatBotInput
              isLoading={isLoading || state.isLoading}
              input={input}
              disabled={state.isDisabled}
              onInputChange={setInput}
              hasPendingFiles={pendingFiles.length > 0}
              onFileUpload={(files) => {
                setPendingFiles((prev) => [...prev, ...files]);
              }}
              onSubmit={async (content) => {
                const trimmedContent = content.trim();
                const hasContent = trimmedContent || pendingFiles.length > 0;
                
                if (!hasContent) return;

                onLoadingChange(true);
                
                // Process files into message parts
                const parts: Array<{ type: 'text'; text: string } | { type: 'file'; data: string; mimeType: string }> = [];
                
                // Process pending files
                for (const file of pendingFiles) {
                  try {
                    if (file.type.startsWith('image/')) {
                      // Convert images to base64 data URL
                      const base64 = await fileToBase64(file);
                      parts.push({
                        type: 'file',
                        data: base64,
                        mimeType: file.type,
                      });
                    } else {
                      // Read text files as text
                      const text = await fileToText(file);
                      parts.push({
                        type: 'text',
                        text: `[File: ${file.name}]\n\`\`\`\n${text}\n\`\`\`\n`,
                      });
                    }
                  } catch (err) {
                    console.error('Error processing file:', file.name, err);
                  }
                }
                
                // Add the user's message
                if (trimmedContent) {
                  parts.push({ type: 'text', text: trimmedContent });
                }

                // Combine all text parts for now (since the API might not support file parts directly)
                const textParts = parts
                  .filter((p) => p.type === 'text')
                  .map((p) => (p as { type: 'text'; text: string }).text)
                  .join('\n\n');

                sendMessage({
                  role: ChatBotMessageRole.User,
                  parts: [{ type: 'text', text: textParts || 'File attached' }],
                });
                
                setInput('');
                setPendingFiles([]);
              }}
            />
          </div>
        </ChatbotContentContainer>
      </If>

      <ChatbotBubble />
    </>
  );
}

function ChatBotHeader(
  props: React.PropsWithChildren<{
    onClose: () => void;
    onRefresh: () => void;
  }>,
) {
  const { state } = useContext(ChatbotContext);

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={
          'flex items-center justify-between border-b px-4 py-3 md:rounded-t-xl'
        }
      >
        <div className={'text-foreground flex flex-col'}>
          <span className={'font-semibold'}>{state.settings.title}</span>
        </div>

        <div className={'flex items-center gap-x-4'}>
          <Tooltip>
            <TooltipTrigger onClick={props.onRefresh}>
              <RefreshCcw
                className={'text-foreground h-4 dark:hover:text-white'}
              />
            </TooltipTrigger>

            <TooltipContent>Reset conversation</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger onClick={props.onClose}>
              <X className={'text-foreground h-4 dark:hover:text-white'} />
            </TooltipTrigger>

            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ChatBotMessages(
  props: React.PropsWithChildren<{
    isLoading: boolean;
    defaultPrompts?: string[];
    messages: UIMessage[];
    onPromptClick: (prompt: string) => void;
  }>,
) {
  const shouldDisplayHelpButtons = useShouldDisplayHelpButtons(props.messages);
  const shouldDisplayDefaultPrompts = props.messages.length < 2;

  return (
    <div className={'relative flex-1 flex-col space-y-2 p-4'}>
      {props.messages.map((message, index) => {
        return <ChatBotMessage key={index} message={message} />;
      })}

      <If condition={props.isLoading}>
        <BubbleAnimation />
      </If>

      <If condition={shouldDisplayHelpButtons}>
        <div className={'py-1'}>
          <HelpButtonsContainer />
        </div>
      </If>

      <If condition={shouldDisplayDefaultPrompts}>
        <div className={'py-4'}>
          <DefaultPromptsContainer
            onPromptClick={props.onPromptClick}
            defaultPrompts={props.defaultPrompts}
          />
        </div>
      </If>
    </div>
  );
}

function ChatBotMessage({ message }: { message: UIMessage }) {
  const { state } = useContext(ChatbotContext);

  const isBot = message.role === ChatBotMessageRole.Assistant;
  const isUser = message.role === ChatBotMessageRole.User;

  const className = cn(
    `flex inline-flex items-center space-x-2 rounded border px-2.5 py-1.5 text-sm markdoc`,
    {
      'bg-secondary text-secondary-foreground': isBot,
      [`bg-primary text-foreground`]: isUser,
    },
  );

  const primaryColor = state.settings.branding.primaryColor;
  const textColor = state.settings.branding.textColor;

  const style = isUser
    ? {
        backgroundColor: primaryColor,
        color: textColor,
      }
    : {};

  return (
    <div
      className={cn(`flex`, {
        'justify-end': isUser,
        'justify-start': isBot,
      })}
    >
      <div className={'flex flex-col space-y-1.5 overflow-x-hidden'}>
        <span
          className={cn('px-1 py-1 text-sm font-medium', {
            'pr-2 text-right': isUser,
          })}
        >
          {isBot ? `AI` : `You`}
        </span>

        <div style={style} className={className}>
          <MarkdownRenderer className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 overflow-x-hidden break-words">
            {(() => {
              const textPart = message.parts?.find(
                (part) => part.type === 'text',
              );

              return textPart && 'text' in textPart ? textPart.text : '';
            })()}
          </MarkdownRenderer>
        </div>
      </div>
    </div>
  );
}

function ChatBotInput({
  isLoading,
  disabled,
  input,
  onInputChange,
  onSubmit,
  onFileUpload,
  hasPendingFiles = false,
}: React.PropsWithChildren<{
  input: string;
  isLoading: boolean;
  disabled: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (content: string) => void;
  onFileUpload?: (files: File[]) => void;
  hasPendingFiles?: boolean;
}>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleSubmit = useCallback(() => {
    if (isLoading || disabled) {
      return;
    }
    onSubmit(input);
    // Reset height after submit
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [onSubmit, input, disabled, isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter sends, Shift+Enter adds newline
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      // Shift+Enter adds newline (default behavior)
    },
    [handleSubmit],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0 && onFileUpload) {
        onFileUpload(files);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [onFileUpload],
  );

  return (
    <div className={'border-t bg-background'}>
      <div className={'relative flex items-end'}>
        {/* File upload button */}
        {onFileUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept=".txt,.md,.json,.csv,.pdf,.png,.jpg,.jpeg,.gif,.webp"
            />
            <button
              type="button"
              disabled={isLoading || disabled}
              onClick={() => fileInputRef.current?.click()}
              className={'p-3 bg-transparent hover:bg-muted rounded-lg transition-colors'}
              title="Attach files"
            >
              <Paperclip className={'text-muted-foreground h-5 w-5'} />
            </button>
          </>
        )}

        <textarea
          ref={textareaRef}
          disabled={isLoading || disabled}
          autoComplete={'off'}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          name={'message'}
          rows={1}
          className={
            'text-muted-foreground min-h-[56px] max-h-[200px] py-4 px-2' +
            ' w-full outline-none' +
            ' resize-none text-sm transition-colors' +
            ' bg-background focus:text-secondary-foreground'
          }
          placeholder="Type a message... (Shift+Enter for new line)"
        />

        <button
          disabled={isLoading || disabled || (!input.trim() && !hasPendingFiles)}
          type={'button'}
          onClick={handleSubmit}
          className={'p-3 bg-transparent hover:bg-muted rounded-lg transition-colors disabled:opacity-50'}
          title="Send message (Shift+Enter)"
        >
          <Send className={'text-muted-foreground h-5 w-5'} />
        </button>
      </div>
    </div>
  );
}

function HelpButtonsContainer() {
  const supportFallbackUrl = process.env.NEXT_PUBLIC_CHATBOT_FALLBACK_URL;

  if (!supportFallbackUrl) {
    return null;
  }

  return (
    <div className={'flex'}>
      <ClickablePrompt href={supportFallbackUrl}>
        Contact Support
      </ClickablePrompt>
    </div>
  );
}

function DefaultPromptsContainer({
  defaultPrompts,
  onPromptClick,
}: {
  defaultPrompts?: string[];
  onPromptClick: (prompt: string) => void;
}) {
  if (!defaultPrompts) {
    return null;
  }

  return (
    <div className={'grid grid-cols-2 gap-2'}>
      {defaultPrompts.map((text, index) => {
        return (
          <ClickablePrompt
            key={index}
            onClick={() => {
              onPromptClick(text);
            }}
          >
            {text}
          </ClickablePrompt>
        );
      })}
    </div>
  );
}

function ClickablePrompt(
  props: React.PropsWithChildren<
    | {
        onClick: () => void;
      }
    | {
        href: string;
      }
  >,
) {
  const className = `p-1.5 rounded-md text-xs inline-flex border 
      text-left transition-all hover:bg-muted`;

  if ('href' in props) {
    return (
      <a href={props.href} className={className}>
        {props.children}
      </a>
    );
  }

  return (
    <button className={className} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

function BubbleAnimation() {
  const dotClassName = `rounded-full bg-muted h-2.5 w-2.5`;

  return (
    <div
      className={
        'animate-in slide-in-from-bottom-12 py-4 duration-1000 ease-out'
      }
    >
      <div className={'flex animate-bounce space-x-1 duration-750'}>
        <div className={dotClassName} />
        <div className={dotClassName} />
        <div className={dotClassName} />
      </div>
    </div>
  );
}

function useShouldDisplayHelpButtons(messages: UIMessage[]) {
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage) {
    return false;
  }

  const textPart = lastMessage.parts?.find((part) => part.type === 'text');
  const messageText = textPart && 'text' in textPart ? textPart.text : '';
  return messageText.includes(`Sorry, I don't know how to help with that`);
}

function useScrollToBottom<
  ScrollingDiv extends {
    current: HTMLDivElement | null;
  },
>(scrollingDiv: ScrollingDiv) {
  return useCallback(
    ({ smooth } = { smooth: false }) => {
      setTimeout(() => {
        const div = scrollingDiv.current;

        if (!div) return;

        div.scrollTo({
          behavior: smooth ? 'smooth' : 'auto',
          top: div.scrollHeight,
        });
      }, 50);
    },
    [scrollingDiv],
  );
}

function ChatbotContentContainer(
  props: React.PropsWithChildren<{
    position?: 'bottom-left' | 'bottom-right';
  }>,
) {
  const position = props.position ?? 'bottom-right';

  const className = cn({
    'bottom-0 md:right-8 md:bottom-36': position === 'bottom-right',
    'bottom-0 md:bottom-36 md:left-8': position === 'bottom-left',
  });

  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-bottom-24 fixed z-50 duration-200' +
          ' bg-background font-sans md:rounded-lg' +
          ' h-[60vh] w-full md:w-[40vw] xl:w-[26vw]' +
          ' zoom-in-90 border shadow-2xl',
        className,
      )}
    >
      {props.children}
    </div>
  );
}

// File helper functions
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
