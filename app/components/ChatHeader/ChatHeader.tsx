'use client';

import { useState } from 'react';
import { Settings, Sparkles, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';

interface ChatHeaderProps {
  modelName?: string;
  threadId?: string;
  onThreadDelete?: () => void;
  onThreadRename?: () => void;
}

export default function ChatHeader({ 
  modelName = 'Llama 3.3 70B',
  threadId,
  onThreadDelete,
  onThreadRename
}: ChatHeaderProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRename = async () => {
    if (!threadId || !newTitle.trim()) return;

    setIsRenaming(true);
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (response.ok) {
        setIsRenameDialogOpen(false);
        setNewTitle('');
        if (onThreadRename) {
          onThreadRename();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to rename thread');
      }
    } catch (error) {
      console.error('Error renaming thread:', error);
      alert('Failed to rename thread');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!threadId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        if (onThreadDelete) {
          onThreadDelete();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete thread');
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      alert('Failed to delete thread');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRenameClick = () => {
    // Fetch current thread title
    if (threadId) {
      fetch(`/api/threads/${threadId}`)
        .then(res => res.json())
        .then(data => {
          if (data.thread) {
            setNewTitle(data.thread.title);
            setIsRenameDialogOpen(true);
          }
        })
        .catch(err => {
          console.error('Error fetching thread:', err);
          setIsRenameDialogOpen(true);
        });
    } else {
      setIsRenameDialogOpen(true);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold truncate max-w-[150px] sm:max-w-none">AI Chatbot</h2>
            <p className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))]">Powered by Fyora</p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {threadId && (
              <>
                <DropdownMenuItem onClick={handleRenameClick} disabled={isRenaming}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename Thread
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeleteClick} 
                  disabled={isDeleting}
                  className="text-[hsl(var(--destructive))]"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Thread
                </DropdownMenuItem>
              </>
            )}
            {!threadId && (
              <DropdownMenuItem disabled>No active conversation</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>
              Enter a new name for this conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Conversation name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameDialogOpen(false);
                setNewTitle('');
              }}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename} 
              disabled={!newTitle.trim() || isRenaming}
            >
              {isRenaming ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/90 text-[hsl(var(--destructive-foreground))]"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

