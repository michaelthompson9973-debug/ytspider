import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ImageIcon, Upload, Check, Loader2, X, Zap } from 'lucide-react';

export interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
  accept?: 'image' | 'video' | 'all';
}

export default function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  multiple = true,
  accept = 'image',
}: MediaPickerDialogProps) {
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [folder, setFolder] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; optimizing: boolean }>({ current: 0, total: 0, optimizing: false });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch media from database
  const { data: mediaList, isLoading } = useQuery({
    queryKey: ['media-picker', accept, folder],
    queryFn: async () => {
      let query = supabase.from('media').select('*').order('created_at', { ascending: false });

      // Filter by type
      if (accept === 'image') {
        query = query.like('file_type', 'image/%');
      } else if (accept === 'video') {
        query = query.like('file_type', 'video/%');
      }

      // Filter by folder
      if (folder !== 'all') {
        query = query.eq('folder', folder);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Get unique folders
  const { data: folders } = useQuery({
    queryKey: ['media-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('folder')
        .not('folder', 'is', null);
      if (error) throw error;
      const uniqueFolders = [...new Set(data.map((m) => m.folder).filter(Boolean))] as string[];
      return uniqueFolders;
    },
    enabled: open,
  });

  const toggleSelect = (url: string) => {
    if (multiple) {
      setSelectedUrls((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
      );
    } else {
      setSelectedUrls([url]);
    }
  };

  const handleConfirm = () => {
    if (selectedUrls.length > 0) {
      onSelect(selectedUrls);
      setSelectedUrls([]);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedUrls([]);
    onOpenChange(false);
  };

  // Optimize image via edge function
  const optimizeImage = async (file: File): Promise<{ url: string; originalSize: number; compressedSize: number } | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('folder', 'uploads');
      formData.append('maxWidth', '1920');
      formData.append('quality', '0.8');

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
      };
    } catch (error) {
      console.error('Optimization failed:', error);
      return null;
    }
  };

  // Fallback direct upload (for videos or if optimization fails)
  const directUpload = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      return null;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

    const { error: insertError } = await supabase.from('media').insert({
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      public_url: urlData.publicUrl,
      folder: 'uploads',
    });

    if (insertError) {
      toast({ title: 'Database error', description: insertError.message, variant: 'destructive' });
    }

    return urlData.publicUrl;
  };

  // Upload handler with optimization
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const fileArray = Array.from(files);
    setUploadProgress({ current: 0, total: fileArray.length, optimizing: false });
    const uploadedUrls: string[] = [];
    let totalSaved = 0;

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress({ current: i + 1, total: fileArray.length, optimizing: file.type.startsWith('image/') });

        // Validate file type
        if (accept === 'image' && !file.type.startsWith('image/')) {
          toast({ title: 'Invalid file type', description: 'Only images allowed', variant: 'destructive' });
          continue;
        }
        if (accept === 'video' && !file.type.startsWith('video/')) {
          toast({ title: 'Invalid file type', description: 'Only videos allowed', variant: 'destructive' });
          continue;
        }

        let url: string | null = null;

        // Use optimization for images
        if (file.type.startsWith('image/')) {
          const result = await optimizeImage(file);
          if (result) {
            url = result.url;
            totalSaved += result.originalSize - result.compressedSize;
          } else {
            // Fallback to direct upload if optimization fails
            url = await directUpload(file);
          }
        } else {
          // Direct upload for non-images
          url = await directUpload(file);
        }

        if (url) {
          uploadedUrls.push(url);
        }
      }

      if (uploadedUrls.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['media-picker'] });
        queryClient.invalidateQueries({ queryKey: ['media-folders'] });
        
        // Auto-select uploaded files
        if (multiple) {
          setSelectedUrls((prev) => [...prev, ...uploadedUrls]);
        } else {
          setSelectedUrls([uploadedUrls[0]]);
        }
        
        // Show success with optimization stats
        const savedMB = (totalSaved / (1024 * 1024)).toFixed(2);
        if (totalSaved > 0) {
          toast({ 
            title: `${uploadedUrls.length} ফাইল আপলোড হয়েছে`, 
            description: `${savedMB} MB অপটিমাইজ করা হয়েছে ⚡` 
          });
        } else {
          toast({ title: `${uploadedUrls.length} ফাইল আপলোড হয়েছে` });
        }
      }
    } catch (error) {
      toast({ title: 'Upload error', description: String(error), variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0, optimizing: false });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const acceptMime = accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : '*/*';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Select {accept === 'video' ? 'Video' : 'Image'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="gallery" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Folder filter */}
            <div className="mb-3">
              <Select value={folder} onValueChange={setFolder}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Files" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  {folders?.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Media grid */}
            <ScrollArea className="flex-1 border rounded-md">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !mediaList?.length ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mb-2" />
                  <p>No files found</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3">
                  {mediaList.map((item) => {
                    const isSelected = selectedUrls.includes(item.public_url || '');
                    return (
                      <button
                        key={item.id}
                        onClick={() => item.public_url && toggleSelect(item.public_url)}
                        className={cn(
                          'relative aspect-square rounded-md overflow-hidden border-2 transition-all',
                          isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-muted-foreground/30'
                        )}
                      >
                        {item.file_type?.startsWith('image/') ? (
                          <img
                            src={item.public_url || ''}
                            alt={item.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              {item.file_type?.split('/')[1]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 mt-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                'h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 transition-colors',
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30',
                uploading && 'opacity-50 pointer-events-none'
              )}
            >
              {uploading ? (
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {uploadProgress.optimizing ? (
                      <span className="flex items-center justify-center gap-1">
                        <Zap className="h-4 w-4 text-amber-500" />
                        অপটিমাইজ করা হচ্ছে...
                      </span>
                    ) : (
                      'আপলোড হচ্ছে...'
                    )}
                  </p>
                  {uploadProgress.total > 1 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {uploadProgress.current} / {uploadProgress.total}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ড্র্যাগ & ড্রপ করুন অথবা
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    ফাইল সিলেক্ট করুন
                  </Button>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    ইমেজ অটো অপটিমাইজ হবে
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptMime}
                    multiple={multiple}
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </>
              )}
            </div>

            {/* Selected preview */}
            {selectedUrls.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Selected ({selectedUrls.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUrls.map((url) => (
                    <div key={url} className="relative w-16 h-16">
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover rounded border"
                      />
                      <button
                        onClick={() => toggleSelect(url)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedUrls.length === 0}>
            Select ({selectedUrls.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
