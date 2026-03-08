import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Copy, Mail, KeyRound, Loader2, Check, AlertTriangle } from 'lucide-react';

interface ResetCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
}

export function ResetCredentialsDialog({ open, onOpenChange, userId, userEmail, userName }: ResetCredentialsDialogProps) {
  const [sendEmail, setSendEmail] = useState(true);
  const [result, setResult] = useState<{ email: string; password: string; emailSent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const resetMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('reset-shop-credentials', {
        body: { userId, sendEmail },
      });
      if (error) throw new Error(error.message || 'Failed to reset credentials');
      if (!data.success) throw new Error(data.error || 'Failed');
      return data as { success: boolean; email: string; password: string; emailSent: boolean };
    },
    onSuccess: (data) => {
      setResult({ email: data.email, password: data.password, emailSent: data.emailSent });
      toast.success('পাসওয়ার্ড রিসেট সফল হয়েছে!');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleCopy = async () => {
    if (!result) return;
    const text = `ইমেইল: ${result.email}\nপাসওয়ার্ড: ${result.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('কপি করা হয়েছে!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setResult(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            পাসওয়ার্ড রিসেট
          </DialogTitle>
          <DialogDescription>
            {userName || userEmail} এর পাসওয়ার্ড রিসেট করুন
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      এটি একটি সিকিউরিটি অপারেশন
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      নতুন পাসওয়ার্ড জেনারেট হবে এবং পুরাতন পাসওয়ার্ড আর কাজ করবে না।
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmail"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked === true)}
                />
                <Label htmlFor="sendEmail" className="text-sm">
                  নতুন পাসওয়ার্ড ইমেইলে পাঠান ({userEmail})
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>বাতিল</Button>
              <Button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                variant="destructive"
              >
                {resetMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />রিসেট হচ্ছে...</>
                ) : (
                  <><KeyRound className="h-4 w-4 mr-2" />পাসওয়ার্ড রিসেট করুন</>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">ইমেইল:</span>
                  <span className="font-medium">{result.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">পাসওয়ার্ড:</span>
                  <span className="font-medium text-primary">{result.password}</span>
                </div>
              </div>

              {result.emailSent && (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <Mail className="h-4 w-4" />
                  ইমেইলে পাঠানো হয়েছে
                </div>
              )}

              {sendEmail && !result.emailSent && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  ইমেইল পাঠানো যায়নি — নিচের বাটন থেকে কপি করুন
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'কপি হয়েছে!' : 'কপি করুন'}
              </Button>
              <Button onClick={handleClose}>বন্ধ করুন</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
