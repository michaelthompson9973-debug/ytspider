import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
  .max(72, 'পাসওয়ার্ড সর্বোচ্চ ৭২ অক্ষরের হতে পারে');

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Listen for PASSWORD_RECOVERY event from the Supabase redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecovery(true);
        }
      }
    );

    // Also check URL hash for recovery token (type=recovery)
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    // Confirm match
    if (password !== confirmPassword) {
      toast.error('পাসওয়ার্ড মিলছে না');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        if (error.message.includes('same password')) {
          toast.error('আগের পাসওয়ার্ড ব্যবহার করা যাবে না');
        } else {
          toast.error(error.message);
        }
        return;
      }

      setSuccess(true);
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');

      // Redirect after short delay
      setTimeout(() => {
        navigate('/shop/login', { replace: true });
      }, 2000);
    } catch {
      toast.error('কিছু সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  // If not a recovery session, show an error state
  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">অবৈধ লিংক</CardTitle>
            <CardDescription>
              এই পাসওয়ার্ড রিসেট লিংকটি মেয়াদোত্তীর্ণ বা অবৈধ। অনুগ্রহ করে আবার রিসেট রিকোয়েস্ট করুন।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate('/forgot-password')}
            >
              নতুন রিসেট লিংক নিন
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            {success ? (
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            ) : (
              <KeyRound className="h-7 w-7 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {success ? 'পাসওয়ার্ড পরিবর্তন সফল!' : 'নতুন পাসওয়ার্ড সেট করুন'}
          </CardTitle>
          <CardDescription>
            {success
              ? 'আপনাকে লগইন পেজে নিয়ে যাওয়া হচ্ছে...'
              : 'আপনার নতুন পাসওয়ার্ড দিন।'}
          </CardDescription>
        </CardHeader>
        {!success && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">নতুন পাসওয়ার্ড</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="আবার পাসওয়ার্ড দিন"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
