'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
      <div className="bg-[hsl(var(--muted))] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 border border-[hsl(var(--border))]">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))]"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))]"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))]"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}

