import React from 'react';
import { Copy, Check, ExternalLink, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface WebhookStatusCardProps {
  provider: 'steadfast' | 'pathao';
}

export function WebhookStatusCard({ provider }: WebhookStatusCardProps) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/courier-webhook`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast({
        title: 'Copied',
        description: 'Webhook URL copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy URL',
        variant: 'destructive',
      });
    }
  };

  const getProviderDocs = () => {
    if (provider === 'steadfast') {
      return 'https://portal.packzy.com';
    }
    return 'https://merchant.pathao.com';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhook Configuration
        </CardTitle>
        <CardDescription>
          Configure webhook in {provider === 'steadfast' ? 'Steadfast' : 'Pathao'} dashboard to receive status updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Webhook URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">
              {webhookUrl}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Setup Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to {provider === 'steadfast' ? 'Steadfast' : 'Pathao'} merchant dashboard</li>
            <li>Navigate to Settings → Webhook</li>
            <li>Paste the webhook URL above</li>
            <li>Enable status update notifications</li>
            <li>Save the configuration</li>
          </ol>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <a href={getProviderDocs()} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open {provider === 'steadfast' ? 'Steadfast' : 'Pathao'} Dashboard
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
