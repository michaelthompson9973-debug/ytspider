import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Upload, Copy, Trash2, FolderPlus, Image, Video, File, Zap, Loader2 } from 'lucide-react';

export default function Media() {
  const [folder, setFolder] = useState('root');
  const [newFolder, setNewFolder] = useState('');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; optimizing: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { uploadFiles, isOptimizing } = useImageOptimizer({ folder });

  const { data: media, isLoading } = useQuery({
    queryKey: ['media', folder],
    queryFn: async () => {
      let query = supabase.from('media').select('*').order('created_at', { ascending: false });
      if (folder !== 'all') {
        query = query.eq('folder', folder);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: folders } = useQuery({
    queryKey: ['media-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('folder');
      if (error) throw error;
      const uniqueFolders = [...new Set(data.map(m => m.folder).filter(Boolean))];
      return uniqueFolders as string[];
    },
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadProgress({ current: 0, total: files.length, optimizing: false });

    await uploadFiles(files, user?.id, (current, total, optimizing) => {
      setUploadProgress({ current, total, optimizing });
    });

    queryClient.invalidateQueries({ queryKey: ['media'] });
    queryClient.invalidateQueries({ queryKey: ['media-folders'] });
    
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const uploading = isOptimizing || uploadProgress !== null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Media Library</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFolderDialogOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadProgress?.optimizing ? (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-400" />
                      অপটিমাইজ হচ্ছে...
                    </span>
                  ) : (
                    `আপলোড ${uploadProgress?.current}/${uploadProgress?.total}`
                  )}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  <Zap className="mr-1 h-3 w-3 text-amber-500" />
                  Upload
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>

        {/* Optimization info banner */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <span>ইমেজ অটোমেটিক অপটিমাইজ হয় - ফাইল সাইজ কমে, কোয়ালিটি থাকে!</span>
        </div>

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
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center">
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
                  <CardContent className="p-3">
                    <p className="truncate text-sm font-medium">{item.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : ''}
                    </p>
                    <div className="mt-2 flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => item.public_url && copyUrl(item.public_url)}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copy URL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

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
      </div>
    </AdminLayout>
  );
}
