import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Facebook } from 'lucide-react';
import type { FacebookPage } from '@/hooks/useFacebookLogin';

interface PageSelectorProps {
  pages: FacebookPage[];
  connectedPageIds: string[];
  onConnect: (page: FacebookPage) => Promise<void>;
}

export function PageSelector({ pages, connectedPageIds, onConnect }: PageSelectorProps) {
  const [connectingPageId, setConnectingPageId] = useState<string | null>(null);

  const handleConnect = async (page: FacebookPage) => {
    setConnectingPageId(page.id);
    try {
      await onConnect(page);
    } finally {
      setConnectingPageId(null);
    }
  };

  if (pages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Facebook className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>কোনো পেজ পাওয়া যায়নি</p>
        <p className="text-sm mt-1">
          আপনার Facebook অ্যাকাউন্টে কোনো পেজ নেই বা এই অ্যাপে access দেওয়া হয়নি
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">আপনার Pages ({pages.length})</h4>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {pages.map((page) => {
          const isConnected = connectedPageIds.includes(page.id);
          const isConnecting = connectingPageId === page.id;

          return (
            <div
              key={page.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={page.picture?.data?.url} alt={page.name} />
                  <AvatarFallback>
                    <Facebook className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{page.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{page.category || 'Page'}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground font-mono">{page.id}</span>
                  </div>
                </div>
              </div>

              {isConnected ? (
                <Badge variant="secondary" className="gap-1 bg-accent text-accent-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleConnect(page)}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
