import { useCallback, useState } from 'react';
import { Upload, Image, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  accept?: string;
}

export function BulkUploadZone({ 
  onFilesSelected, 
  disabled = false,
  accept = 'image/*,video/*'
}: BulkUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [disabled, onFilesSelected]);

  const handleClick = useCallback(() => {
    if (disabled) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = accept;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    };
    input.click();
  }, [disabled, accept, onFilesSelected]);

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
        isDragOver 
          ? 'border-primary bg-primary/10 scale-[1.02]' 
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className={cn(
          'p-3 rounded-full transition-colors',
          isDragOver ? 'bg-primary/20' : 'bg-muted'
        )}>
          <Upload className={cn(
            'h-8 w-8 transition-colors',
            isDragOver ? 'text-primary' : 'text-muted-foreground'
          )} />
        </div>
        
        <div>
          <p className="font-medium text-foreground">
            {isDragOver ? 'ফাইল ছেড়ে দিন' : 'ফাইল ড্র্যাগ করুন অথবা ক্লিক করুন'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            একসাথে অনেক ফাইল আপলোড করতে পারবেন
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Image className="h-3 w-3" />
            JPG, PNG, GIF, WebP
          </span>
          <span className="flex items-center gap-1">
            <Video className="h-3 w-3" />
            MP4, WebM
          </span>
        </div>
      </div>

      {isDragOver && (
        <div className="absolute inset-0 bg-primary/5 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}
