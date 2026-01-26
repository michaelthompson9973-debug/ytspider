import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
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
import { ImageIcon, Upload, Check, Loader2, X } from 'lucide-react';

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

  // Upload handler
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (accept === 'image' && !file.type.startsWith('image/')) {
          toast({ title: 'Invalid file type', description: 'Only images allowed', variant: 'destructive' });
          continue;
        }
        if (accept === 'video' && !file.type.startsWith('video/')) {
          toast({ title: 'Invalid file type', description: 'Only videos allowed', variant: 'destructive' });
          continue;
        }

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `uploads/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) {
          toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

        // Insert into media table
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
          continue;
        }

        uploadedUrls.push(urlData.publicUrl);
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
        
        toast({ title: `${uploadedUrls.length} file(s) uploaded` });
      }
    } catch (error) {
      toast({ title: 'Upload error', description: String(error), variant: 'destructive' });
    } finally {
      setUploading(false);
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
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop files here or
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse Files
                  </Button>
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
