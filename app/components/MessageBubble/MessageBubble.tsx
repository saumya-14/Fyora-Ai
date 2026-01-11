'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  webSearchUsed?: boolean;
}

export default function MessageBubble({
  role,
  content,
  timestamp,
  sources,
  webSearchUsed,
}: MessageBubbleProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyCode = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(`${index}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 group',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-semibold">AI</span>
        </div>
      )}
      
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[80%] md:max-w-[70%] rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3',
          isUser
            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
            : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]'
        )}
      >
        {!isUser ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const codeIndex = `${node?.position?.start?.line || Math.random()}`;

                  return !inline && match ? (
                    <div className="relative my-4">
                      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--background))] rounded-t-lg border-b border-[hsl(var(--border))]">
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {match[1]}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyCode(codeString, parseInt(codeIndex))}
                        >
                          {copiedCode === codeIndex ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <pre className="rounded-b-lg">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }: any) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }: any) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }: any) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                ),
                a: ({ href, children }: any) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(var(--primary))] hover:underline inline-flex items-center gap-1"
                  >
                    {children}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        )}

        {/* Sources and metadata */}
        {(sources && sources.length > 0) || webSearchUsed ? (
          <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
            {webSearchUsed && (
              <div className="text-xs text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-1">
                <span>🔍</span>
                <span>Web Search</span>
              </div>
            )}
            {sources && sources.length > 0 && (
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                <span className="font-semibold">Sources: </span>
                {sources.map((source, idx) => (
                  <span key={idx}>
                    {idx > 0 && ', '}
                    {source.length > 50 ? `${source.substring(0, 50)}...` : source}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Timestamp */}
        <div
          className={cn(
            'text-xs mt-2',
            isUser
              ? 'text-[hsl(var(--primary-foreground))]/70'
              : 'text-[hsl(var(--muted-foreground))]'
          )}
        >
          {formatTime(timestamp)}
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0">
          <span className="text-[hsl(var(--muted-foreground))] text-xs font-semibold">U</span>
        </div>
      )}
    </motion.div>
  );
}

