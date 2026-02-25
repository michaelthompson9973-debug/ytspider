import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Store } from 'lucide-react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import { AuthSkeleton } from '@/components/landing/AuthSkeleton';
import { PageLoadWrapper } from '@/components/landing/PageLoadWrapper';

export default function ShopLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shopInfo, setShopInfo] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [ready, setReady] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { availableShops, switchShop } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Detect shop from subdomain or query param
  useEffect(() => {
    const detectShop = async () => {
      const hostname = window.location.hostname;
      let shopSlug: string | null = null;

      const parts = hostname.split('.');
      if (parts.length >= 3 && !['www', 'app', 'admin'].includes(parts[0])) {
        shopSlug = parts[0];
      }

      if (!shopSlug) {
        shopSlug = searchParams.get('shop');
      }

      if (shopSlug) {
        const { data } = await supabase
          .from('shops')
          .select('name, logo_url, slug')
          .eq('slug', shopSlug)
          .eq('is_active', true)
          .single();

        if (data) {
          setShopInfo({ name: data.name, logo_url: data.logo_url });
        }
      }
    };

    detectShop();
  }, [searchParams]);

  // Auto redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
        return;
      }
      if (availableShops.length > 0) {
        const firstShop = availableShops[0];
        switchShop(firstShop.id).then(() => {
          navigate('/shop', { replace: true });
        });
      }
    }
  }, [user, authLoading, availableShops, switchShop, navigate, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('আপনার ইমেইল ভেরিফাই করুন');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('লগইন সফল!');
    } catch (err) {
      toast.error('লগইন করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !ready) {
    return <AuthSkeleton />;
  }

  return (
    <PageLoadWrapper>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 pt-20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {shopInfo?.logo_url ? (
              <img src={shopInfo.logo_url} alt={shopInfo.name} className="h-16 w-16 mx-auto rounded-lg object-cover mb-2" />
            ) : (
              <div className="h-16 w-16 mx-auto rounded-lg bg-primary flex items-center justify-center mb-2">
                <Store className="h-8 w-8 text-primary-foreground" />
              </div>
            )}
            <CardTitle className="text-2xl">{shopInfo?.name || 'Shop Login'}</CardTitle>
            <CardDescription>আপনার শপ ড্যাশবোর্ডে প্রবেশ করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'লগইন হচ্ছে...' : 'লগইন'}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
              <Link to="/forgot-password" className="hover:underline block">পাসওয়ার্ড ভুলে গেছেন?</Link>
              <p>নতুন অ্যাকাউন্ট দরকার?{" "}<Link to="/register" className="text-primary font-medium hover:underline">রেজিস্ট্রেশন করুন</Link></p>
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Powered by{' '}<a href="https://ytspider.com" className="hover:underline" target="_blank" rel="noopener">YTSpider</a>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </PageLoadWrapper>
  );
}
