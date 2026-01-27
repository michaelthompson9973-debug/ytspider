import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Trash2, Globe, CheckCircle, XCircle, RefreshCw, AlertCircle, Loader2, ExternalLink, Copy, Info } from 'lucide-react';
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

interface AllowedDomain {
  id: string;
  domain: string;
  enabled: boolean;
  created_at: string;
}

type DnsStatus = 'idle' | 'checking' | 'success' | 'error';

interface DomainCheckResult {
  status: DnsStatus;
  message?: string;
}

// Domain validation regex
const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

export default function AllowedDomains() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<AllowedDomain | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const [domainChecks, setDomainChecks] = useState<Record<string, DomainCheckResult>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check if domain is pointing correctly
  const checkDomain = async (domain: string) => {
    setDomainChecks(prev => ({ ...prev, [domain]: { status: 'checking' } }));
    
    try {
      // Try to fetch the domain to see if it's pointing to our app
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        mode: 'no-cors',
      });
      
      // Since we're using no-cors, we can't read the response
      // But if we get here, the domain is at least reachable
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
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AllowedDomain[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (domain: string) => {
      const { error } = await supabase
        .from('allowed_domains')
        .insert([{ domain: domain.toLowerCase() }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-domains'] });
      setDialogOpen(false);
      setNewDomain('');
      toast({ title: 'Domain added successfully' });
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

  const validateDomain = (domain: string): boolean => {
    if (!domain.trim()) {
      setDomainError('Domain is required');
      return false;
    }
    if (!domainRegex.test(domain)) {
      setDomainError('Invalid domain format (e.g., example.com or sub.example.com)');
      return false;
    }
    setDomainError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDomain(newDomain)) {
      addMutation.mutate(newDomain);
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
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-mono text-sm font-medium">{domain.domain}</span>
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(domain.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                      {/* DNS Check Button */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => checkDomain(domain.domain)}
                              disabled={domainChecks[domain.domain]?.status === 'checking'}
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
                            <p>Check if domain is pointing correctly</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Visit Link */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
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
                        onCheckedChange={(checked) => 
                          toggleMutation.mutate({ id: domain.id, enabled: checked })
                        }
                        disabled={toggleMutation.isPending}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(domain)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Guide Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-lg">ডোমেইন সেটাপ গাইড</h4>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="step1">
                <AccordionTrigger className="text-sm font-medium">
                  ধাপ ১: DNS Record যুক্ত করুন
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    আপনার Domain Provider (Namecheap, GoDaddy, Cloudflare ইত্যাদি) এর DNS Settings এ যান এবং নিচের record গুলো যুক্ত করুন:
                  </p>
                  
                  <div className="bg-muted p-3 rounded-lg space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-muted-foreground">Type:</span> <strong>A</strong> | 
                        <span className="text-muted-foreground ml-2">Host:</span> <strong>@</strong> বা <strong>subdomain</strong> | 
                        <span className="text-muted-foreground ml-2">Value:</span> <strong>আপনার Server IP</strong>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard('A Record')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                    <p className="text-amber-800 dark:text-amber-200 text-xs">
                      <strong>Note:</strong> Subdomain এর জন্য (যেমন: offers.example.com), Host এ শুধু "offers" লিখুন, পুরো domain না।
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="step2">
                <AccordionTrigger className="text-sm font-medium">
                  ধাপ ২: Server Configuration (Nginx)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    আপনার Nginx configuration এ নতুন domain এর জন্য server block যুক্ত করুন:
                  </p>
                  
                  <div className="bg-muted p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{`server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:YOUR_APP_PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}</pre>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyToClipboard(`server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:YOUR_APP_PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Config
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="step3">
                <AccordionTrigger className="text-sm font-medium">
                  ধাপ ৩: SSL Certificate (HTTPS)
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Certbot দিয়ে Free SSL certificate নিন:
                  </p>
                  
                  <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                    <code>sudo certbot --nginx -d your-domain.com</code>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard('sudo certbot --nginx -d your-domain.com')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Command
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="step4">
                <AccordionTrigger className="text-sm font-medium">
                  ধাপ ৪: DNS Propagation যাচাই করুন
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    DNS changes apply হতে ২৪-৪৮ ঘন্টা পর্যন্ত লাগতে পারে। নিচের command দিয়ে check করুন:
                  </p>
                  
                  <div className="bg-muted p-3 rounded-lg font-mono text-xs space-y-1">
                    <div><code>nslookup your-domain.com</code></div>
                    <div><code>dig your-domain.com</code></div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
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
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="step5">
                <AccordionTrigger className="text-sm font-medium">
                  ধাপ ৫: এখানে Domain Add করুন
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    উপরের সব সেটাপ হয়ে গেলে:
                  </p>
                  
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>"Add Domain" বাটনে ক্লিক করুন</li>
                    <li>আপনার domain name লিখুন (যেমন: offers.example.com)</li>
                    <li>"Check" বাটন দিয়ে verify করুন domain কাজ করছে কিনা</li>
                    <li>Enable করুন এবং landing page URL visit করুন</li>
                  </ol>
                  
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 text-xs">
                      <strong>✓ Example URL:</strong> https://your-domain.com/your-landing-page-slug
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Quick Info Card */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-4">
            <h4 className="font-semibold text-sm mb-2">How it works</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Add domains that should serve your landing pages</li>
              <li>• Disabled domains will show "Domain Not Authorized" page</li>
              <li>• Slug-based routing works on all enabled domains (e.g., domain.com/sale)</li>
              <li>• Localhost and preview environments are automatically bypassed</li>
            </ul>
          </CardContent>
        </Card>

        {/* Add Domain Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Allowed Domain</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com or sub.example.com"
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value.toLowerCase());
                    if (domainError) validateDomain(e.target.value);
                  }}
                  className={domainError ? 'border-destructive' : ''}
                />
                {domainError && (
                  <p className="text-xs text-destructive">{domainError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Configure your DNS to point this domain to your server
                </p>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false);
                    setNewDomain('');
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
                Landing pages will no longer be accessible on this domain.
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
      </div>
    </AdminLayout>
  );
}
