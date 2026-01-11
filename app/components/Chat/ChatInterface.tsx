'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles } from 'lucide-react';
import ChatHeader from '@/app/components/ChatHeader/ChatHeader';
import MessageBubble from '@/app/components/MessageBubble/MessageBubble';
import ChatInput from '@/app/components/ChatInput/ChatInput';
import TypingIndicator from '@/app/components/TypingIndicator/TypingIndicator';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  webSearchUsed?: boolean;
}

interface ChatInterfaceProps {
  threadId?: string;
  onThreadChange?: (threadId: string) => void;
  onThreadDelete?: () => void;
  onThreadRename?: () => void;
}

export default function ChatInterface({ threadId, onThreadChange, onThreadDelete, onThreadRename }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(threadId);
  const [enableWebSearch, setEnableWebSearch] = useState<boolean>(true);
  const [hasMore, setHasMore] = useState(true);
  const skipRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);

  // Load messages when thread changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!threadId) {
        setMessages([]);
        setCurrentThreadId(undefined);
        skipRef.current = 0;
        setHasMore(true);
        return;
      }

      setIsLoadingMessages(true);
      skipRef.current = 0;
      
      try {
        const response = await fetch(`/api/threads/${threadId}?limit=10&skip=0`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to load messages (${response.status})`);
        }

        const data = await response.json();
        
        const formattedMessages: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg._id || msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp || msg.createdAt),
          sources: msg.sourceDocuments || msg.sources || [],
          webSearchUsed: msg.webSearchUsed || false,
        }));

        setMessages(formattedMessages);
        setCurrentThreadId(threadId);
        setHasMore(data.pagination?.hasMore || false);
        skipRef.current = formattedMessages.length;
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [threadId]);

  // Load more messages function
  const loadMoreMessages = useCallback(async () => {
    if (!currentThreadId || !hasMore || isLoadingMore || isLoadingMessages || isLoading) return;

    setIsLoadingMore(true);
    try {
      const currentSkip = skipRef.current;
      const response = await fetch(`/api/threads/${currentThreadId}?limit=10&skip=${currentSkip}`);
      
      if (!response.ok) {
        throw new Error('Failed to load more messages');
      }

      const data = await response.json();
      
      const formattedMessages: Message[] = (data.messages || []).map((msg: any) => ({
        id: msg._id || msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp || msg.createdAt),
        sources: msg.sourceDocuments || msg.sources || [],
        webSearchUsed: msg.webSearchUsed || false,
      }));

      if (formattedMessages.length > 0) {
        // Get current scroll position
        const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        const previousScrollHeight = scrollContainer?.scrollHeight || 0;
        const currentScrollTop = scrollContainer?.scrollTop || 0;

        // Prepend older messages to the beginning
        setMessages(prev => [...formattedMessages, ...prev]);
        setHasMore(data.pagination?.hasMore || false);
        skipRef.current = currentSkip + formattedMessages.length;

        // Maintain scroll position after loading
        setTimeout(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = currentScrollTop + (newScrollHeight - previousScrollHeight);
          }
        }, 0);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentThreadId, hasMore, isLoadingMore, isLoadingMessages, isLoading]);

  // Handle scroll for loading older messages
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer || !currentThreadId) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      
      // Load more when scrolled to top (within 200px)
      if (scrollTop < 200 && hasMore && !isLoadingMore && !isLoadingMessages && !isLoading) {
        loadMoreMessages();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, isLoadingMessages, isLoading, currentThreadId, loadMoreMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [messages, isLoading]);

  const handleSend = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          threadId: currentThreadId,
          enableWebSearch: enableWebSearch,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();

      if (!currentThreadId && data.threadId) {
        setCurrentThreadId(data.threadId);
        if (onThreadChange) {
          onThreadChange(data.threadId);
        }
      }

      const assistantMessage: Message = {
        id: data.messageId || Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        sources: data.sources || [],
        webSearchUsed: data.webSearchUsed || false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response. Please try again.'}`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[hsl(var(--background))]">
      <ChatHeader 
        threadId={currentThreadId}
        onThreadDelete={onThreadDelete}
        onThreadRename={onThreadRename}
      />
      
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="min-h-full">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full min-h-[300px] sm:min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[hsl(var(--primary))] mx-auto mb-4"></div>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center h-full min-h-[300px] sm:min-h-[400px] px-4"
            >
              <div className="text-center max-w-md">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h2 className="text-lg sm:text-2xl font-semibold mb-2 text-[hsl(var(--foreground))]">
                  {currentThreadId ? 'No messages yet' : 'Welcome to Fyora Chat'}
                </h2>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                  {currentThreadId 
                    ? 'Start the conversation by typing a message below'
                    : 'Select a conversation or start a new one to begin chatting'}
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Load More Indicator at Top */}
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(var(--primary))]"></div>
                </div>
              )}
              <div ref={messagesTopRef} />
              <AnimatePresence>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    sources={message.sources}
                    webSearchUsed={message.webSearchUsed}
                  />
                ))}
              </AnimatePresence>
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        enableWebSearch={enableWebSearch}
        onWebSearchToggle={setEnableWebSearch}
      />
    </div>
  );
}
