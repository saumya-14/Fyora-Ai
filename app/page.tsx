'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from './components/Chat/ChatInterface';
import DocumentUpload from './components/DocumentUpload/DocumentUpload';
import Sidebar from './components/Sidebar/Sidebar';
import { Menu, X } from 'lucide-react';
import { Button } from './components/ui/button';

export default function Home() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handleNewThread = () => {
    setSelectedThreadId(undefined);
  };

  const handleThreadDelete = () => {
    setSelectedThreadId(undefined);
    // Trigger sidebar refresh
    setRefreshKey(prev => prev + 1);
  };

  const handleThreadRename = () => {
    // Trigger sidebar refresh
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[hsl(var(--background))]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <div className="lg:hidden">
              <Sidebar
                key={refreshKey}
                selectedThreadId={selectedThreadId}
                onSelectThread={handleSelectThread}
                onNewThread={handleNewThread}
                isMobile={true}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          key={refreshKey}
          selectedThreadId={selectedThreadId}
          onSelectThread={handleSelectThread}
          onNewThread={handleNewThread}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <h1 className="font-semibold text-base sm:text-lg">Fyora</h1>
          <div className="w-8 sm:w-10" /> {/* Spacer */}
        </div>

        <ChatInterface
          threadId={selectedThreadId}
          onThreadChange={handleSelectThread}
          onThreadDelete={handleThreadDelete}
          onThreadRename={handleThreadRename}
        />
      </div>

      {/* Document Upload Button */}
      <DocumentUpload />
    </div>
  );
}
