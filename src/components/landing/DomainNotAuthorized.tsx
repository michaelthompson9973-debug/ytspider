import { ShieldX, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DomainNotAuthorizedProps {
  hostname: string;
}

export function DomainNotAuthorized({ hostname }: DomainNotAuthorizedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/50 p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Domain Not Authorized</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This domain is not configured to serve landing pages.
          </p>
          
          <div className="bg-muted rounded-lg p-3 flex items-center justify-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <code className="text-sm font-mono">{hostname}</code>
          </div>
          
          <p className="text-sm text-muted-foreground">
            If you are the site owner, please add this domain to the allowlist in the admin panel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
