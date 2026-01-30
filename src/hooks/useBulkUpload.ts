import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UploadingFile } from '@/components/admin/UploadProgressList';

interface UseBulkUploadOptions {
  folder?: string;
  maxWidth?: number;
  quality?: number;
  concurrentUploads?: number;
}

export function useBulkUpload(options: UseBulkUploadOptions = {}) {
  const {
    folder = 'uploads',
    maxWidth = 1200,
    quality = 0.5,
    concurrentUploads = 3,
  } = options;

  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<Map<string, AbortController>>(new Map());
  const { toast } = useToast();

  const updateFile = useCallback((id: string, updates: Partial<UploadingFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const uploadSingleFile = useCallback(async (
    uploadingFile: UploadingFile,
    userId?: string
  ): Promise<void> => {
    const { id, file } = uploadingFile;
    const isImage = file.type.startsWith('image/');

    try {
      updateFile(id, { status: 'uploading', progress: 10 });

      if (isImage) {
        // Use optimization edge function for images
        updateFile(id, { progress: 30 });
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('folder', folder);
        formData.append('maxWidth', maxWidth.toString());
        formData.append('quality', quality.toString());

        updateFile(id, { status: 'compressing', progress: 50 });

        const { data, error } = await supabase.functions.invoke('optimize-image', {
          body: formData,
        });

        if (error) throw error;

        const savedBytes = data.original_size - data.compressed_size;
        const savedPercent = data.reduction_percent;

        updateFile(id, { 
          status: 'done', 
          progress: 100,
          url: data.public_url,
          savedBytes,
          savedPercent,
        });
      } else {
        // Direct upload for non-images (videos, etc.)
        updateFile(id, { progress: 50 });

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

        updateFile(id, { progress: 80 });

        await supabase.from('media').insert({
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          public_url: urlData.publicUrl,
          folder: folder,
          uploaded_by: userId,
        });

        updateFile(id, { 
          status: 'done', 
          progress: 100,
          url: urlData.publicUrl,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      updateFile(id, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  }, [folder, maxWidth, quality, updateFile]);

  const processQueue = useCallback(async (
    filesToProcess: UploadingFile[],
    userId?: string
  ) => {
    const queue = [...filesToProcess];
    const activeUploads: Promise<void>[] = [];

    const processNext = async (): Promise<void> => {
      const file = queue.find(f => f.status === 'queued');
      if (!file) return;

      updateFile(file.id, { status: 'uploading' });
      await uploadSingleFile(file, userId);
      await processNext();
    };

    // Start concurrent uploads
    for (let i = 0; i < Math.min(concurrentUploads, queue.length); i++) {
      activeUploads.push(processNext());
    }

    await Promise.all(activeUploads);
  }, [concurrentUploads, uploadSingleFile, updateFile]);

  const startUpload = useCallback(async (
    newFiles: File[],
    userId?: string
  ) => {
    if (newFiles.length === 0) return;

    const uploadingFiles: UploadingFile[] = newFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'queued' as const,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...uploadingFiles]);
    setIsUploading(true);

    await processQueue(uploadingFiles, userId);

    setIsUploading(false);

    // Show summary toast
    const completed = uploadingFiles.filter(f => f.status !== 'error').length;
    const totalSaved = uploadingFiles.reduce((acc, f) => acc + (f.savedBytes || 0), 0);

    if (completed > 0) {
      const savedMB = (totalSaved / (1024 * 1024)).toFixed(2);
      toast({
        title: `${completed} ফাইল আপলোড হয়েছে`,
        description: totalSaved > 1024 ? `${savedMB} MB অপটিমাইজ করা হয়েছে ⚡` : undefined,
      });
    }
  }, [processQueue, toast]);

  const cancelUpload = useCallback((id: string) => {
    const controller = abortControllerRef.current.get(id);
    if (controller) {
      controller.abort();
      abortControllerRef.current.delete(id);
    }
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== 'done' && f.status !== 'error'));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    isUploading,
    startUpload,
    cancelUpload,
    clearCompleted,
    clearAll,
  };
}
