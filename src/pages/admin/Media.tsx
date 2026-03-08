import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { ShopGuard } from '@/components/admin/ShopGuard';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useImageOptimizer } from '@/hooks/useImageOptimizer';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import { BulkUploadZone } from '@/components/admin/BulkUploadZone';
import { UploadProgressList } from '@/components/admin/UploadProgressList';
import { Copy, Trash2, FolderPlus, Image, Video, File, Zap, Loader2, CheckSquare, Square, X } from 'lucide-react';

export default function Media() {
  const { currentShop } = useShop();
  const [folder, setFolder] = useState('root');
  const [newFolder, setNewFolder] = useState('');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [compressingId, setCompressingId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<NonNullable<typeof media>[number] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { optimizeImage } = useImageOptimizer({ folder });
  const { files: uploadingFiles, isUploading, startUpload, cancelUpload, clearAll } = useBulkUpload({ folder });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (media) setSelectedIds(new Set(media.map(m => m.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const { data: media, isLoading } = useQuery({
    queryKey: ['media', folder, currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      let query = supabase.from('media').select('*').eq('shop_id', currentShop.id).order('created_at', { ascending: false });
      if (folder !== 'all') {
        query = query.eq('folder', folder);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!currentShop,
  });

  const { data: folders } = useQuery({
    queryKey: ['media-folders', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];
      const { data, error } = await supabase
        .from('media')
        .select('folder')
        .eq('shop_id', currentShop.id);
      if (error) throw error;
      const uniqueFolders = [...new Set(data.map(m => m.folder).filter(Boolean))];
      return uniqueFolders as string[];
    },
    enabled: !!currentShop,
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: NonNullable<typeof media>[number]) => {
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([item.file_path]);

      if (storageError) console.error('Storage delete error:', storageError);

      const { error: dbError } = await supabase
        .from('media')
        .delete()
        .eq('id', item.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast({ title: 'File deleted' });
    },
    onError: (error) => {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const itemsToDelete = media?.filter(m => ids.includes(m.id)) || [];
      const filePaths = itemsToDelete.map(m => m.file_path);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove(filePaths);
      
      if (storageError) console.error('Bulk storage delete error:', storageError);
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('media')
        .delete()
        .in('id', ids);
      
      if (dbError) throw dbError;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      clearSelection();
      toast({ title: `${count} files deleted` });
    },
    onError: (error) => {
      toast({ title: 'Bulk delete failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleCompress = async (item: NonNullable<typeof media>[number]) => {
    if (!item.public_url || !item.file_type.startsWith('image/')) return;
    
    setCompressingId(item.id);
    try {
      const { data: blobData, error: downloadError } = await supabase.storage
        .from('media')
        .download(item.file_path);
      
      if (downloadError || !blobData) {
        throw new Error(downloadError?.message || 'Failed to download file');
      }
      
      const file = new globalThis.File([blobData], item.file_name, { type: item.file_type });
      
      const result = await optimizeImage(file);
      if (result) {
        await supabase.storage.from('media').remove([item.file_path]);
        
        await supabase
          .from('media')
          .update({
            file_path: result.url.split('/media/')[1] || item.file_path,
            file_size: result.compressedSize,
            public_url: result.url,
          })
          .eq('id', item.id);
        
        queryClient.invalidateQueries({ queryKey: ['media'] });
        
        const savedKB = ((result.originalSize - result.compressedSize) / 1024).toFixed(1);
        toast({ 
          title: 'ইমেজ কম্প্রেস হয়েছে ⚡', 
          description: `${savedKB} KB সেভ হয়েছে (${result.reductionPercent.toFixed(0)}% কম)` 
        });
      }
    } catch (error) {
      console.error('Compression error:', error);
      toast({ title: 'কম্প্রেশন ব্যর্থ', description: String(error), variant: 'destructive' });
    } finally {
      setCompressingId(null);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    await startUpload(files, user?.id);
    queryClient.invalidateQueries({ queryKey: ['media'] });
    queryClient.invalidateQueries({ queryKey: ['media-folders'] });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'URL copied to clipboard' });
  };

  const createFolder = () => {
    if (newFolder.trim()) {
      setFolder(newFolder.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'));
      setNewFolder('');
      setFolderDialogOpen(false);
    }
  };

  const getIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    return File;
  };

  return (
    <AdminLayout>
      <ShopGuard>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Media Library</h1>
          <Button variant="outline" onClick={() => setFolderDialogOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>

        {/* Bulk Upload Zone */}
        <BulkUploadZone 
          onFilesSelected={handleFilesSelected} 
          disabled={isUploading}
        />

        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <UploadProgressList 
            files={uploadingFiles}
            onCancel={cancelUpload}
            onClear={clearAll}
          />
        )}

        {/* Optimization info banner */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Zap className="h-4 w-4 text-primary" />
          <span>Images are automatically optimized — file size reduced, quality preserved!</span>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Folder:</span>
            <Select value={folder} onValueChange={setFolder}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                <SelectItem value="root">Root</SelectItem>
                {folders?.filter(f => f !== 'root').map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Selection controls */}
          {media && media.length > 0 && (
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setBulkDeleteOpen(true)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={selectAll}>
                  <CheckSquare className="mr-1 h-3 w-3" />
                  সব সিলেক্ট
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Loading...
            </div>
          ) : media?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No files in this folder
            </div>
          ) : (
            media?.map((item) => {
              const Icon = getIcon(item.file_type);
              const isImage = item.file_type.startsWith('image/');
              
              return (
                <Card 
                  key={item.id} 
                  className={`overflow-hidden cursor-pointer transition-all ${selectedIds.has(item.id) ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <div className="aspect-video bg-muted flex items-center justify-center relative">
                    {/* Selection indicator */}
                    <div className="absolute top-2 left-2 z-10">
                      {selectedIds.has(item.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary bg-background rounded" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                    {isImage && item.public_url ? (
                      <img
                        src={item.public_url}
                        alt={item.file_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-3" onClick={(e) => e.stopPropagation()}>
                    <p className="truncate text-sm font-medium">{item.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => item.public_url && copyUrl(item.public_url)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {isImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompress(item)}
                          disabled={compressingId === item.id}
                          title="কম্প্রেস করুন"
                        >
                          {compressingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3 text-primary" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteItem(item)}
                        title="ডিলিট করুন"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* New Folder Dialog */}
        <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Folder name"
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createFolder}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ফাইল ডিলিট করুন?</DialogTitle>
              <DialogDescription>
                আপনি কি নিশ্চিত যে "{deleteItem?.file_name}" ফাইলটি ডিলিট করতে চান? এই কাজটি আর ফেরানো যাবে না।
              </DialogDescription>
            </DialogHeader>
            {deleteItem && (
              <div className="flex justify-center py-4">
                {deleteItem.file_type.startsWith('image/') && deleteItem.public_url ? (
                  <img
                    src={deleteItem.public_url}
                    alt={deleteItem.file_name}
                    className="max-h-32 rounded-md object-contain"
                  />
                ) : (
                  <File className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteItem(null)}>
                বাতিল
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteItem) {
                    deleteMutation.mutate(deleteItem);
                    setDeleteItem(null);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                ডিলিট করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>বাল্ক ডিলিট করুন?</DialogTitle>
              <DialogDescription>
                আপনি কি নিশ্চিত যে {selectedIds.size}টি ফাইল ডিলিট করতে চান? এই কাজটি আর ফেরানো যাবে না।
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto py-4">
              {media?.filter(m => selectedIds.has(m.id)).slice(0, 8).map(item => (
                <div key={item.id} className="aspect-square bg-muted rounded overflow-hidden">
                  {item.file_type.startsWith('image/') && item.public_url ? (
                    <img src={item.public_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <File className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {selectedIds.size > 8 && (
                <div className="aspect-square bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                  +{selectedIds.size - 8}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>
                বাতিল
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  bulkDeleteMutation.mutate([...selectedIds]);
                  setBulkDeleteOpen(false);
                }}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {selectedIds.size}টি ডিলিট করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </ShopGuard>
    </AdminLayout>
  );
}
