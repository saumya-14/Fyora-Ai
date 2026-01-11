'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'success' | 'error';
  message?: string;
}

interface DocumentUploadProps {
  onUploadSuccess?: (documentId: string) => void;
}

export default function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown'];
  const allowedExtensions = ['.pdf', '.txt', '.docx', '.md'];

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return (
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(extension)
    );
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) {
      alert('Invalid file type. Supported: PDF, TXT, DOCX, MD');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadProgress(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploadProgress({
      fileName: selectedFile.name,
      progress: 0,
      status: 'uploading',
      message: 'Uploading file...',
    });

    try {
      // Simulate upload progress (since we can't track actual progress with fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (!prev || prev.progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return {
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          };
        });
      }, 200);

      setUploadProgress((prev) => ({
        ...prev!,
        status: 'processing',
        message: 'Processing document...',
      }));

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      setUploadProgress({
        fileName: selectedFile.name,
        progress: 100,
        status: 'success',
        message: `Success! ${data.document.chunkCount} chunks created.`,
      });

      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(null);
        setIsOpen(false);
        if (onUploadSuccess) {
          onUploadSuccess(data.document.id);
        }
      }, 2000);
    } catch (error: any) {
      setUploadProgress({
        fileName: selectedFile.name,
        progress: 0,
        status: 'error',
        message: error.message || 'Upload failed. Please try again.',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <>
      {/* Upload Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-full p-3 sm:p-4 shadow-lg transition-colors z-10"
        title="Upload Document"
      >
        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
      </motion.button>

      {/* Upload Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsOpen(false);
              setSelectedFile(null);
              setUploadProgress(null);
            }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-[hsl(var(--border))]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  Upload Document
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedFile(null);
                    setUploadProgress(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Drag and Drop Area */}
                {!selectedFile && (
                  <motion.div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    animate={{
                      borderColor: dragActive
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--border))',
                      backgroundColor: dragActive
                        ? 'hsl(var(--primary)) / 0.05'
                        : 'transparent',
                    }}
                    className="border-2 border-dashed rounded-xl p-12 text-center transition-colors"
                  >
                    <Upload className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
                    <p className="text-[hsl(var(--foreground))] mb-2">
                      Drag and drop your file here, or
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 font-medium"
                    >
                      browse to upload
                    </button>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                      Supported: PDF, TXT, DOCX, MD (Max 10MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.docx,.md"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </motion.div>
                )}

                {/* Selected File */}
                {selectedFile && !uploadProgress && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[hsl(var(--muted))] rounded-xl border border-[hsl(var(--border))]">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                        <div>
                          <p className="font-medium text-[hsl(var(--foreground))]">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleUpload}
                      className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]"
                    >
                      Upload Document
                    </Button>
                  </div>
                )}

                {/* Upload Progress */}
                {uploadProgress && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[hsl(var(--muted))] rounded-xl border border-[hsl(var(--border))]">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                          {uploadProgress.status === 'success' ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : uploadProgress.status === 'error' ? (
                            <AlertCircle className="w-6 h-6 text-[hsl(var(--destructive))]" />
                          ) : (
                            <Loader2 className="w-6 h-6 text-[hsl(var(--primary))] animate-spin" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[hsl(var(--foreground))]">
                            {uploadProgress.fileName}
                          </p>
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            {uploadProgress.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {uploadProgress.status !== 'success' && uploadProgress.status !== 'error' && (
                      <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress.progress}%` }}
                          className="bg-[hsl(var(--primary))] h-2 rounded-full transition-all duration-300"
                        />
                      </div>
                    )}

                    {uploadProgress.status === 'error' && (
                      <Button
                        onClick={() => {
                          setUploadProgress(null);
                          setSelectedFile(null);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Try Again
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

