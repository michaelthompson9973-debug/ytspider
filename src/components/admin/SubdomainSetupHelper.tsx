import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal, 
  RefreshCw,
  CheckCircle,
  Circle
} from 'lucide-react';

interface SubdomainSetupHelperProps {
  domain: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheck: (domain: string) => void;
}

// Parse domain to extract subdomain and parent
const parseDomain = (domain: string) => {
  // Remove wildcard prefix if present
  const cleanDomain = domain.replace(/^\*\./, '');
  const parts = cleanDomain.split('.');
  
  if (parts.length > 2) {
    const subdomain = parts[0];
    const parent = parts.slice(1).join('.');
    return { subdomain, parent, isSubdomain: true };
  }
  return { subdomain: '@', parent: cleanDomain, isSubdomain: false };
};

// Generate DNS records based on domain type
const getDnsRecords = (domain: string) => {
  const { subdomain, isSubdomain } = parseDomain(domain);
  
  if (isSubdomain) {
    return {
      cname: { type: 'CNAME', host: subdomain, value: 'cname.vercel-dns.com' },
      aRecord: { type: 'A', host: subdomain, value: '76.76.21.21' }
    };
  }
  return {
    aRecord: { type: 'A', host: '@', value: '76.76.21.21' },
    cname: { type: 'CNAME', host: 'www', value: 'cname.vercel-dns.com' }
  };
};

// Generate terminal commands
const getTerminalCommands = (domain: string) => `# Vercel CLI
vercel domains add ${domain}

# DNS Verify
nslookup ${domain}
dig ${domain} +short`;

export function SubdomainSetupHelper({ 
  domain, 
  open, 
  onOpenChange,
  onCheck 
}: SubdomainSetupHelperProps) {
  const { toast } = useToast();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set([1])); // Step 1 is auto-completed
  const { subdomain, parent, isSubdomain } = parseDomain(domain);
  const dnsRecords = getDnsRecords(domain);
  
  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label || 'Copied'} to clipboard!` });
  };

  const toggleStep = (step: number) => {
    const newSteps = new Set(completedSteps);
    if (newSteps.has(step)) {
      newSteps.delete(step);
    } else {
      newSteps.add(step);
    }
    setCompletedSteps(newSteps);
  };

  const handleCheck = () => {
    onCheck(domain);
    toggleStep(4);
  };

  const StepIcon = ({ step }: { step: number }) => {
    if (completedSteps.has(step)) {
      return <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />;
    }
    return (
      <button onClick={() => toggleStep(step)} className="hover:opacity-70 transition-opacity">
        <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Setup: <span className="font-mono text-primary">{domain}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          {/* Step 1: Admin Panel Added */}
          <div className="flex gap-3">
            <StepIcon step={1} />
            <div className="flex-1">
              <p className="font-medium text-sm">
                Step 1: Domain Added in Admin Panel
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                ✓ Your domain has been added successfully
              </p>
            </div>
          </div>

          {/* Step 2: Vercel Domain Add */}
          <div className="flex gap-3">
            <StepIcon step={2} />
            <div className="flex-1 space-y-2">
              <p className="font-medium text-sm">
                Step 2: Add Domain to Vercel
              </p>
              
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono break-all">vercel domains add {domain}</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      copyToClipboard(`vercel domains add ${domain}`, 'Vercel command');
                      toggleStep(2);
                    }}
                    className="shrink-0 h-7 px-2"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Or go to <span className="font-medium">Vercel Dashboard</span> → Settings → Domains → Add
              </p>
            </div>
          </div>

          {/* Step 3: DNS Records */}
          <div className="flex gap-3">
            <StepIcon step={3} />
            <div className="flex-1 space-y-3">
              <p className="font-medium text-sm">
                Step 3: Configure DNS Records
              </p>
              
              {/* CNAME Record */}
              <div className="space-y-1.5">
                <Badge variant="outline" className="text-xs">CNAME Record (Recommended)</Badge>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono">
                    <span><span className="text-muted-foreground">Type:</span> <strong>CNAME</strong></span>
                    <span><span className="text-muted-foreground">Host:</span> <strong>{dnsRecords.cname.host}</strong></span>
                    <span><span className="text-muted-foreground">Value:</span> <strong>{dnsRecords.cname.value}</strong></span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        copyToClipboard(
                          `Type: CNAME | Host: ${dnsRecords.cname.host} | Value: ${dnsRecords.cname.value}`,
                          'CNAME record'
                        );
                        toggleStep(3);
                      }}
                      className="ml-auto h-6 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* A Record */}
              <div className="space-y-1.5">
                <Badge variant="secondary" className="text-xs">A Record (Alternative)</Badge>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono">
                    <span><span className="text-muted-foreground">Type:</span> <strong>A</strong></span>
                    <span><span className="text-muted-foreground">Host:</span> <strong>{dnsRecords.aRecord.host}</strong></span>
                    <span><span className="text-muted-foreground">Value:</span> <strong>{dnsRecords.aRecord.value}</strong></span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        copyToClipboard(dnsRecords.aRecord.value, 'IP address');
                        toggleStep(3);
                      }}
                      className="ml-auto h-6 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: DNS Propagation Check */}
          <div className="flex gap-3">
            <StepIcon step={4} />
            <div className="flex-1 space-y-2">
              <p className="font-medium text-sm">
                Step 4: DNS Propagation Check করুন
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://dnschecker.org/#A/${domain}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    DNSChecker.org
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://www.whatsmydns.net/#A/${domain}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    whatsmydns.net
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Terminal Commands Section */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              Terminal Commands (copy all)
            </div>
            <div className="bg-muted rounded-lg p-3">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">
                {getTerminalCommands(domain)}
              </pre>
              <div className="flex justify-end mt-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => copyToClipboard(getTerminalCommands(domain), 'All commands')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy All
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCheck} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Check Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export helper functions for use in parent component
export { parseDomain, getDnsRecords, getTerminalCommands };
