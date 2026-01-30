import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OptimizeResult {
  url: string;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
}

interface UploadResult {
  url: string;
  originalSize: number;
  compressedSize: number;
  wasOptimized: boolean;
}

interface UseImageOptimizerOptions {
  maxWidth?: number;
  quality?: number;
  folder?: string;
}

export function useImageOptimizer(options: UseImageOptimizerOptions = {}) {
  const { maxWidth = 1920, quality = 0.8, folder = 'uploads' } = options;
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  // Optimize a single image via edge function
  const optimizeImage = async (file: File): Promise<OptimizeResult | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('folder', folder);
      formData.append('maxWidth', maxWidth.toString());
      formData.append('quality', quality.toString());

      const { data, error } = await supabase.functions.invoke('optimize-image', {
        body: formData,
      });

      if (error) {
        console.error('Optimization error:', error);
        return null;
      }

      return {
        url: data.public_url,
        originalSize: data.original_size,
        compressedSize: data.compressed_size,
        reductionPercent: data.reduction_percent,
      };
    } catch (error) {
      console.error('Optimization failed:', error);
      return null;
    }
  };

  // Direct upload fallback (for videos or if optimization fails)
  const directUpload = async (file: File, userId?: string): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

    const { error: insertError } = await supabase.from('media').insert({
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      public_url: urlData.publicUrl,
      folder: folder,
      uploaded_by: userId,
    });

    if (insertError) {
      console.error('Database insert error:', insertError);
    }

    return urlData.publicUrl;
  };

  // Upload a single file with optimization for images
  const uploadFile = async (file: File, userId?: string): Promise<UploadResult | null> => {
    // Use optimization for images
    if (file.type.startsWith('image/')) {
      const result = await optimizeImage(file);
      if (result) {
        return {
          url: result.url,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          wasOptimized: true,
        };
      }
      // Fallback to direct upload if optimization fails
      const url = await directUpload(file, userId);
      return url ? {
        url,
        originalSize: file.size,
        compressedSize: file.size,
        wasOptimized: false,
      } : null;
    }

    // Direct upload for non-images
    const url = await directUpload(file, userId);
    return url ? {
      url,
      originalSize: file.size,
      compressedSize: file.size,
      wasOptimized: false,
    } : null;
  };

  // Upload multiple files with progress tracking
  const uploadFiles = async (
    files: File[] | FileList,
    userId?: string,
    onProgress?: (current: number, total: number, isOptimizing: boolean) => void
  ): Promise<{ urls: string[]; totalSaved: number }> => {
    const fileArray = Array.from(files);
    setIsOptimizing(true);
    setProgress({ current: 0, total: fileArray.length });

    const urls: string[] = [];
    let totalSaved = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const isImage = file.type.startsWith('image/');
      
      setProgress({ current: i + 1, total: fileArray.length });
      onProgress?.(i + 1, fileArray.length, isImage);

      const result = await uploadFile(file, userId);
      if (result) {
        urls.push(result.url);
        if (result.wasOptimized) {
          totalSaved += result.originalSize - result.compressedSize;
        }
      }
    }

    setIsOptimizing(false);
    setProgress({ current: 0, total: 0 });

    // Show success message with optimization stats
    if (urls.length > 0) {
      const savedMB = (totalSaved / (1024 * 1024)).toFixed(2);
      if (totalSaved > 1024) { // Only show if saved more than 1KB
        toast({
          title: `${urls.length} ফাইল আপলোড হয়েছে`,
          description: `${savedMB} MB অপটিমাইজ করা হয়েছে ⚡`,
        });
      } else {
        toast({ title: `${urls.length} ফাইল আপলোড হয়েছে` });
      }
    }

    return { urls, totalSaved };
  };

  return {
    uploadFile,
    uploadFiles,
    optimizeImage,
    directUpload,
    isOptimizing,
    progress,
  };
}
