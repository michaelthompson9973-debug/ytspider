import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().trim().email('সঠিক ইমেইল দিন');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailSent(true);
    } catch {
      toast.error('কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            {emailSent ? (
              <CheckCircle className="h-7 w-7 text-primary" />
            ) : (
              <Mail className="h-7 w-7 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {emailSent ? 'ইমেইল পাঠানো হয়েছে' : 'পাসওয়ার্ড রিসেট'}
          </CardTitle>
          <CardDescription>
            {emailSent
              ? 'আপনার ইমেইলে রিসেট লিংক পাঠানো হয়েছে। ইনবক্স এবং স্প্যাম ফোল্ডার চেক করুন।'
              : 'আপনার অ্যাকাউন্টের ইমেইল দিন, আমরা রিসেট লিংক পাঠাবো।'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong>{email}</strong> এ একটি রিসেট লিংক পাঠানো হয়েছে।
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
              >
                আবার পাঠান
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/shop/login"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              লগইনে ফিরে যান
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
