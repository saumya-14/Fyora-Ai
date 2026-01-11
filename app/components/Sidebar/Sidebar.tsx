'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  X,
  Menu
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { cn } from '@/app/lib/utils';

interface Thread {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface SidebarProps {
  selectedThreadId?: string;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ 
  selectedThreadId, 
  onSelectThread, 
  onNewThread,
  isMobile = false,
  onClose
}: SidebarProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const skipRef = useRef(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchThreads = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        skipRef.current = 0;
      } else {
        setIsLoadingMore(true);
      }

      const currentSkip = skipRef.current;
      const response = await fetch(`/api/threads?limit=10&skip=${currentSkip}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }

      const data = await response.json();
      
      if (reset) {
        setThreads(data.threads || []);
      } else {
        setThreads(prev => [...prev, ...(data.threads || [])]);
      }
      
      setHasMore(data.pagination?.hasMore || false);
      skipRef.current = currentSkip + (data.threads?.length || 0);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchThreads(true);
  }, []);

  // Reset and refetch when search query changes
  useEffect(() => {
    if (searchQuery === '') {
      fetchThreads(true);
    }
  }, [searchQuery]);

  // Handle scroll for infinite loading
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;
      
      // Load more when scrolled to bottom (within 100px)
      if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !isLoadingMore && !isLoading && searchQuery === '') {
        fetchThreads(false);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, isLoading, searchQuery]);


  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupedThreads = filteredThreads.reduce((acc, thread) => {
    const timeLabel = formatTime(thread.updatedAt);
    if (!acc[timeLabel]) {
      acc[timeLabel] = [];
    }
    acc[timeLabel].push(thread);
    return acc;
  }, {} as Record<string, Thread[]>);

  return (
    <motion.div
      initial={isMobile ? { x: -320 } : undefined}
      animate={{ x: 0 }}
      exit={isMobile ? { x: -320 } : undefined}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={cn(
        "flex flex-col h-screen bg-[hsl(var(--background))] border-r border-[hsl(var(--border))]",
        isMobile ? "fixed inset-y-0 left-0 z-50 w-[280px] sm:w-80 shadow-xl" : "w-64 lg:w-80"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="font-semibold text-base sm:text-lg">Fyora</span>
        </div>
        {isMobile && onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3 sm:p-4 border-b border-[hsl(var(--border))]">
        <Button
          onClick={onNewThread}
          className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">New Chat</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 sm:p-4 border-b border-[hsl(var(--border))]">
        <div className="relative">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent"
          />
        </div>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-[hsl(var(--muted))] animate-pulse"
                />
              ))}
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="w-12 h-12 text-[hsl(var(--muted-foreground))] mb-4 opacity-50" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </p>
            </div>
          ) : (
            Object.entries(groupedThreads).map(([timeLabel, threads]) => (
              <div key={timeLabel} className="mb-4">
                <h3 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-2 mb-2">
                  {timeLabel}
                </h3>
                <div className="space-y-1">
                  {threads.map((thread) => (
                    <motion.div
                      key={thread._id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div
                        onClick={() => {
                          onSelectThread(thread._id);
                          if (isMobile && onClose) onClose();
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group relative cursor-pointer",
                          selectedThreadId === thread._id
                            ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                            : "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                        )}
                      >
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {thread.title}
                          </p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {thread.messageCount} messages
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
          
          {/* Load More Indicator */}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}

