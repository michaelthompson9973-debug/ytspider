import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Globe, CheckCircle, XCircle, RefreshCw, AlertCircle, Loader2, ExternalLink, Copy, Info, Asterisk, Zap } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubdomainSetupHelper } from '@/components/admin/SubdomainSetupHelper';

interface AllowedDomain {
  id: string;
  domain: string;
  enabled: boolean;
  created_at: string;
  is_wildcard: boolean;
}

type DnsStatus = 'idle' | 'checking' | 'success' | 'error';

interface DomainCheckResult {
  status: DnsStatus;
  message?: string;
}

// Domain validation regex (regular domain)
const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;
// Wildcard domain regex (*.example.com)
const wildcardDomainRegex = /^\*\.[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

export default function AllowedDomains() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<AllowedDomain | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [isWildcard, setIsWildcard] = useState(false);
  const [domainError, setDomainError] = useState('');
  const [domainChecks, setDomainChecks] = useState<Record<string, DomainCheckResult>>({});
  const [setupHelperOpen, setSetupHelperOpen] = useState(false);
  const [selectedDomainForSetup, setSelectedDomainForSetup] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check if domain is pointing correctly
  const checkDomain = async (domain: string) => {
    // Skip check for wildcard domains
    if (domain.startsWith('*.')) {
      toast({
        title: 'Wildcard Domain',
        description: 'Wildcard domains cannot be directly checked. Test with a specific subdomain.',
      });
      return;
    }
    
    setDomainChecks(prev => ({ ...prev, [domain]: { status: 'checking' } }));
    
    try {
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        mode: 'no-cors',
      });
      
      setDomainChecks(prev => ({ 
        ...prev, 
        [domain]: { 
          status: 'success', 
          message: 'Domain is reachable! Verify it shows your landing page.' 
        } 
      }));
      
      toast({
        title: 'Domain Check Complete',
        description: `${domain} is reachable. Please verify it displays your landing page correctly.`,
      });
    } catch (error) {
      setDomainChecks(prev => ({ 
        ...prev, 
        [domain]: { 
          status: 'error', 
          message: 'Could not reach domain. Check DNS settings.' 
        } 
      }));
      
      toast({
        title: 'Domain Check Failed',
        description: `Could not reach ${domain}. Please verify your DNS configuration.`,
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  const { data: domains, isLoading } = useQuery({
    queryKey: ['allowed-domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allowed_domains')
        .select('*')
        .order('is_wildcard', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AllowedDomain[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ domain, isWildcard }: { domain: string; isWildcard: boolean }) => {
      const finalDomain = isWildcard ? `*.${domain.toLowerCase()}` : domain.toLowerCase();
      const { error } = await supabase
        .from('allowed_domains')
        .insert([{ domain: finalDomain, is_wildcard: isWildcard }]);
      if (error) throw error;
      return finalDomain;
    },
    onSuccess: (finalDomain, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allowed-domains'] });
      setDialogOpen(false);
      setNewDomain('');
      setIsWildcard(false);
      toast({ title: 'Domain added successfully' });
      
      // Auto-show setup helper for non-wildcard domains
      if (!variables.isWildcard) {
        setSelectedDomainForSetup(finalDomain);
        setSetupHelperOpen(true);
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast({ title: 'Error', description: 'This domain already exists', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('allowed_domains')
        .update({ enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allowed-domains'] });
      toast({ 
        title: variables.enabled ? 'Domain enabled' : 'Domain disabled',
        description: variables.enabled 
          ? 'Landing pages can now be served on this domain' 
          : 'Landing pages will be blocked on this domain'
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('allowed_domains')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-domains'] });
      setDeleteDialogOpen(false);
      setDomainToDelete(null);
      toast({ title: 'Domain removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const validateDomain = (domain: string, wildcard: boolean): boolean => {
    if (!domain.trim()) {
      setDomainError('Domain is required');
      return false;
    }
    
    // For wildcard, user enters base domain (e.g., example.com), we prepend *.
    // For specific, user enters full domain (e.g., sub.example.com)
    if (wildcard) {
      if (!domainRegex.test(domain)) {
        setDomainError('Invalid domain format (e.g., example.com)');
        return false;
      }
    } else {
      if (!domainRegex.test(domain)) {
        setDomainError('Invalid domain format (e.g., example.com or sub.example.com)');
        return false;
      }
    }
    
    setDomainError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDomain(newDomain, isWildcard)) {
      addMutation.mutate({ domain: newDomain, isWildcard });
    }
  };

  const handleDeleteClick = (domain: AllowedDomain) => {
    setDomainToDelete(domain);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (domainToDelete) {
      deleteMutation.mutate(domainToDelete.id);
    }
  };

  // Separate wildcard and specific domains
  const wildcardDomains = domains?.filter(d => d.is_wildcard) || [];
  const specificDomains = domains?.filter(d => !d.is_wildcard) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Allowed Domains</h1>
            <p className="text-muted-foreground">
              Control which domains can serve landing pages
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Domain
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : !domains || domains.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No domains configured</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Add domains to the allowlist. Only approved domains can serve your landing pages.
                Localhost and preview domains are automatically allowed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Wildcard Domains Section */}
            {wildcardDomains.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Asterisk className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Wildcard Domains</span>
                      <Badge variant="secondary" className="text-xs">
                        All subdomains allowed
                      </Badge>
                    </div>
                  </div>
                  <div className="divide-y">
                    {wildcardDomains.map((domain) => (
                      <DomainRow 
                        key={domain.id} 
                        domain={domain} 
                        domainChecks={domainChecks}
                        onCheck={checkDomain}
                        onToggle={(id, enabled) => toggleMutation.mutate({ id, enabled })}
                        onDelete={handleDeleteClick}
                        onSetup={(d) => {
                          setSelectedDomainForSetup(d);
                          setSetupHelperOpen(true);
                        }}
                        togglePending={toggleMutation.isPending}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Specific Domains Section */}
            {specificDomains.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  {wildcardDomains.length > 0 && (
                    <div className="p-4 border-b bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Specific Domains</span>
                      </div>
                    </div>
                  )}
                  <div className="divide-y">
                    {specificDomains.map((domain) => (
                      <DomainRow 
                        key={domain.id} 
                        domain={domain} 
                        domainChecks={domainChecks}
                        onCheck={checkDomain}
                        onToggle={(id, enabled) => toggleMutation.mutate({ id, enabled })}
                        onDelete={handleDeleteClick}
                        onSetup={(d) => {
                          setSelectedDomainForSetup(d);
                          setSetupHelperOpen(true);
                        }}
                        togglePending={toggleMutation.isPending}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Setup Guide Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-lg">Domain Setup Guide</h4>
            </div>
            
            <Tabs defaultValue="vercel" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="vercel">Vercel Hosting</TabsTrigger>
                <TabsTrigger value="vps">VPS / Self-Hosted</TabsTrigger>
              </TabsList>
              
              <TabsContent value="vercel" className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="vercel-step1">
                    <AccordionTrigger className="text-sm font-medium">
                      Step 1: Add Domain in Vercel
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-sm">
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Vercel Dashboard → Your Project → Settings → Domains</li>
                        <li>Click the "Add" button</li>
                        <li>Enter your domain (e.g., <code className="bg-muted px-1 rounded">example.com</code>)</li>
                        <li>For wildcard: <code className="bg-muted px-1 rounded">*.example.com</code></li>
                      </ol>
                      
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                        <p className="text-amber-800 dark:text-amber-200 text-xs">
                          <strong>⚠️ Note:</strong> Wildcard domains (*.example.com) are only available on Vercel Pro plan.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="vercel-step2">
                    <AccordionTrigger className="text-sm font-medium">
                      Step 2: Set Up DNS Records
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        Go to your Domain Provider's (Namecheap, GoDaddy, etc.) DNS Settings:
                      </p>
                      
                      <div className="space-y-3">
                        <div className="bg-muted p-3 rounded-lg space-y-2">
                          <p className="font-medium text-xs">Root Domain (example.com):</p>
                          <div className="flex items-center justify-between gap-2 font-mono text-xs">
                            <div>Type: <strong>A</strong> | Host: <strong>@</strong> | Value: <strong>76.76.21.21</strong></div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard('76.76.21.21')}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-muted p-3 rounded-lg space-y-2">
                          <p className="font-medium text-xs">WWW Subdomain:</p>
                          <div className="flex items-center justify-between gap-2 font-mono text-xs">
                            <div>Type: <strong>CNAME</strong> | Host: <strong>www</strong> | Value: <strong>cname.vercel-dns.com</strong></div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard('cname.vercel-dns.com')}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-muted p-3 rounded-lg space-y-2">
                          <p className="font-medium text-xs">Wildcard (all subdomains):</p>
                          <div className="flex items-center justify-between gap-2 font-mono text-xs">
                            <div>Type: <strong>A</strong> | Host: <strong>*</strong> | Value: <strong>76.76.21.21</strong></div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard('76.76.21.21')}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="vercel-step3">
                    <AccordionTrigger className="text-sm font-medium">
                      Step 3: Add Domain Here
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-sm">
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Click the "Add Domain" button</li>
                        <li>Enter your base domain (e.g., example.com)</li>
                        <li>Check <strong>Wildcard Mode</strong> to allow all subdomains</li>
                        <li>Or enter a specific subdomain</li>
                      </ol>
                      
                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                        <p className="text-green-800 dark:text-green-200 text-xs">
                          <strong>✓ SSL/HTTPS:</strong> Vercel automatically sets up SSL certificates!
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
              
              <TabsContent value="vps" className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="vps-step1">
                    <AccordionTrigger className="text-sm font-medium">
                      Step 1: Add DNS Record
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        Go to your Domain Provider's DNS Settings and add the following record:
                      </p>
                      
                      <div className="bg-muted p-3 rounded-lg space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-muted-foreground">Type:</span> <strong>A</strong> | 
                            <span className="text-muted-foreground ml-2">Host:</span> <strong>@</strong> or <strong>subdomain</strong> | 
                            <span className="text-muted-foreground ml-2">Value:</span> <strong>Your Server IP</strong>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="vps-step2">
                    <AccordionTrigger className="text-sm font-medium">
                      Step 2: Server Configuration (Nginx)
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        Add a server block for the new domain in your Nginx configuration:
                      </p>
                      
                      <div className="bg-muted p-3 rounded-lg font-mono text-xs overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{`server {
    listen 80;
    server_name your-domain.com *.your-domain.com;
    
    location / {
        proxy_pass http://localhost:YOUR_APP_PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`}</pre>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToClipboard(`server {
    listen 80;
    server_name your-domain.com *.your-domain.com;
    
    location / {
        proxy_pass http://localhost:YOUR_APP_PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Config
                      </Button>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="vps-step3">
                    <AccordionTrigger className="text-sm font-medium">
                      Step 3: SSL Certificate (HTTPS)
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        Get a free SSL certificate with Certbot:
                      </p>
                      
                      <div className="bg-muted p-3 rounded-lg font-mono text-xs space-y-1">
                        <div><code>sudo certbot --nginx -d your-domain.com</code></div>
                        <div><code>sudo certbot --nginx -d *.your-domain.com</code></div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard('sudo certbot --nginx -d your-domain.com -d *.your-domain.com')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Command
                      </Button>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="vps-step4">
                    <AccordionTrigger className="text-sm font-medium">
                      Step 4: Add Domain Here
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-sm">
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Click the "Add Domain" button</li>
                        <li>Enable Wildcard Mode to allow all subdomains</li>
                        <li>Or add a specific subdomain</li>
                      </ol>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <a href="https://dnschecker.org/" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          DNS Checker Tool
                        </a>
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Info Card */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-4">
            <h4 className="font-semibold text-sm mb-2">How it works</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Wildcard (*.example.com)</strong> - সব subdomain automatically allowed</li>
              <li>• <strong>Specific domain</strong> - শুধু ঐ domain allowed</li>
              <li>• Disabled domains will show "Domain Not Authorized" page</li>
              <li>• Localhost, .lovable.app, .vercel.app automatically bypassed</li>
            </ul>
          </CardContent>
        </Card>

        {/* Add Domain Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setNewDomain('');
            setIsWildcard(false);
            setDomainError('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Allowed Domain</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder={isWildcard ? "example.com" : "example.com or sub.example.com"}
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value.toLowerCase().replace(/^\*\./, ''));
                    if (domainError) setDomainError('');
                  }}
                  className={domainError ? 'border-destructive' : ''}
                />
                {domainError && (
                  <p className="text-xs text-destructive">{domainError}</p>
                )}
                {isWildcard && newDomain && (
                  <p className="text-xs text-muted-foreground">
                    Will be saved as: <code className="bg-muted px-1 rounded">*.{newDomain}</code>
                  </p>
                )}
              </div>
              
              <div className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/30">
                <Checkbox 
                  id="wildcard" 
                  checked={isWildcard}
                  onCheckedChange={(checked) => setIsWildcard(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="wildcard" className="text-sm font-medium cursor-pointer">
                    Wildcard Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable all subdomains (*.example.com). যেকোনো subdomain automatic allow হবে।
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false);
                    setNewDomain('');
                    setIsWildcard(false);
                    setDomainError('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding...' : 'Add Domain'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Domain?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{domainToDelete?.domain}</strong>? 
                {domainToDelete?.is_wildcard && (
                  <span className="block mt-1 text-amber-600">
                    ⚠️ This will remove access for ALL subdomains under this domain.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Subdomain Setup Helper Dialog */}
        {selectedDomainForSetup && (
          <SubdomainSetupHelper
            domain={selectedDomainForSetup}
            open={setupHelperOpen}
            onOpenChange={setSetupHelperOpen}
            onCheck={checkDomain}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Extracted DomainRow component for cleaner code
function DomainRow({ 
  domain, 
  domainChecks, 
  onCheck, 
  onToggle, 
  onDelete,
  onSetup,
  togglePending 
}: { 
  domain: AllowedDomain; 
  domainChecks: Record<string, DomainCheckResult>;
  onCheck: (domain: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (domain: AllowedDomain) => void;
  onSetup: (domain: string) => void;
  togglePending: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        {domain.is_wildcard ? (
          <Asterisk className="h-5 w-5 text-primary" />
        ) : (
          <Globe className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">{domain.domain}</span>
            {domain.is_wildcard && (
              <Badge variant="outline" className="text-xs">Wildcard</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {domain.is_wildcard 
              ? 'Any subdomain automatically allowed' 
              : `Added ${new Date(domain.created_at).toLocaleDateString()}`
            }
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
        {/* Setup Button (for non-wildcard domains) */}
        {!domain.is_wildcard && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSetup(domain.domain)}
                  className="gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Setup</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Quick setup guide with Vercel CLI & DNS records</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* DNS Check Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCheck(domain.domain)}
                disabled={domainChecks[domain.domain]?.status === 'checking' || domain.is_wildcard}
                className="gap-1.5"
              >
                {domainChecks[domain.domain]?.status === 'checking' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : domainChecks[domain.domain]?.status === 'success' ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                ) : domainChecks[domain.domain]?.status === 'error' ? (
                  <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Check</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{domain.is_wildcard ? 'Wildcard domains cannot be checked directly' : 'Check if domain is pointing correctly'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Visit Link */}
        {!domain.is_wildcard && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Visit domain</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Badge 
          variant={domain.enabled ? 'default' : 'secondary'}
          className="gap-1"
        >
          {domain.enabled ? (
            <>
              <CheckCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Enabled</span>
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Disabled</span>
            </>
          )}
        </Badge>
        <Switch
          checked={domain.enabled}
          onCheckedChange={(checked) => onToggle(domain.id, checked)}
          disabled={togglePending}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(domain)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}