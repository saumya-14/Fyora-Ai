'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { motion } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  enableWebSearch?: boolean;
  onWebSearchToggle?: (enabled: boolean) => void;
}

export default function ChatInput({
  onSend,
  isLoading = false,
  enableWebSearch = true,
  onWebSearchToggle,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      {/* Web Search Toggle */}
      <div className="px-3 sm:px-6 py-2 flex items-center justify-end">
        <label className="flex items-center gap-2 text-xs sm:text-sm text-[hsl(var(--muted-foreground))] cursor-pointer hover:text-[hsl(var(--foreground))] transition-colors">
          <input
            type="checkbox"
            checked={enableWebSearch}
            onChange={(e) => onWebSearchToggle?.(e.target.checked)}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--ring))] focus:ring-2"
          />
          <span className="flex items-center gap-1.5">
            <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Enable Web Search</span>
            <span className="sm:hidden">Web</span>
          </span>
        </label>
      </div>

      {/* Input Container */}
      <div className="px-3 sm:px-6 pb-4 sm:pb-6">
        <motion.div
          initial={false}
          animate={{
            boxShadow: isLoading
              ? '0 0 0 1px hsl(var(--ring))'
              : '0 0 0 1px hsl(var(--border))',
          }}
          className="max-w-4xl mx-auto rounded-xl sm:rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] backdrop-blur-sm shadow-lg"
        >
          <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2 p-2 sm:p-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
              disabled={isLoading}
            >
              <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                rows={1}
                className="w-full resize-none bg-transparent border-none outline-none text-sm sm:text-base placeholder:text-[hsl(var(--muted-foreground))] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 max-h-[200px] overflow-y-auto"
              />
            </div>

            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

