import { CheckCircle2, XCircle, Loader2, Clock, Zap, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UploadingFile {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'compressing' | 'done' | 'error';
  progress: number;
  savedBytes?: number;
  savedPercent?: number;
  error?: string;
  url?: string;
}

interface UploadProgressListProps {
  files: UploadingFile[];
  onCancel?: (id: string) => void;
  onClear?: () => void;
}

export function UploadProgressList({ files, onCancel, onClear }: UploadProgressListProps) {
  if (files.length === 0) return null;

  const completedCount = files.filter(f => f.status === 'done').length;
  const hasErrors = files.some(f => f.status === 'error');
  const allDone = files.every(f => f.status === 'done' || f.status === 'error');

  const totalSaved = files.reduce((acc, f) => acc + (f.savedBytes || 0), 0);

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2 text-sm font-medium">
          {allDone ? (
            hasErrors ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            )
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          <span>
            {allDone 
              ? `${completedCount}/${files.length} আপলোড সম্পন্ন`
              : `আপলোড হচ্ছে ${completedCount}/${files.length}`
            }
          </span>
          {totalSaved > 1024 && (
            <span className="text-xs text-primary flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {(totalSaved / 1024).toFixed(0)} KB সেভ
            </span>
          )}
        </div>
        {allDone && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs">
            বন্ধ করুন
          </Button>
        )}
      </div>

      {/* File list */}
      <div className="max-h-48 overflow-y-auto divide-y">
        {files.map((file) => (
          <UploadProgressItem key={file.id} file={file} onCancel={onCancel} />
        ))}
      </div>
    </div>
  );
}

function UploadProgressItem({ 
  file, 
  onCancel 
}: { 
  file: UploadingFile; 
  onCancel?: (id: string) => void;
}) {
  const statusConfig: Record<UploadingFile['status'], { icon: typeof Clock; color: string; label: string; spin?: boolean }> = {
    queued: { icon: Clock, color: 'text-muted-foreground', label: 'অপেক্ষমান' },
    uploading: { icon: Loader2, color: 'text-primary', label: 'আপলোড হচ্ছে', spin: true },
    compressing: { icon: Zap, color: 'text-amber-500', label: 'কম্প্রেস হচ্ছে', spin: true },
    done: { icon: CheckCircle2, color: 'text-primary', label: 'সম্পন্ন' },
    error: { icon: XCircle, color: 'text-destructive', label: 'ব্যর্থ' },
  };

  const config = statusConfig[file.status];
  const Icon = config.icon;

  return (
    <div className="px-4 py-2 flex items-center gap-3">
      <Icon className={cn(
        'h-4 w-4 flex-shrink-0',
        config.color,
        config.spin && 'animate-spin'
      )} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm truncate">{file.file.name}</p>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {file.status === 'done' && file.savedPercent ? (
              <span className="text-primary">{file.savedPercent.toFixed(0)}% কম</span>
            ) : file.status === 'error' ? (
              <span className="text-destructive">{file.error || 'Error'}</span>
            ) : (
              config.label
            )}
          </span>
        </div>
        
        {(file.status === 'uploading' || file.status === 'compressing') && (
          <Progress value={file.progress} className="h-1 mt-1" />
        )}
      </div>

      {(file.status === 'queued' || file.status === 'uploading') && onCancel && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={() => onCancel(file.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
