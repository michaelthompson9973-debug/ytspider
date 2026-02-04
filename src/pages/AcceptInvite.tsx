import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getInvitationByToken, acceptInvitation, InvitationWithShop } from '@/lib/invitationUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, UserPlus, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'found' | 'not_found' | 'accepted' | 'error'>('loading');
  const [invitation, setInvitation] = useState<InvitationWithShop | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const checkInvitation = async () => {
      if (!token) {
        setStatus('not_found');
        return;
      }

      const inv = await getInvitationByToken(token);
      if (inv) {
        setInvitation(inv);
        setStatus('found');
      } else {
        setStatus('not_found');
      }
    };

    checkInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token || !user) return;

    setIsAccepting(true);
    try {
      const result = await acceptInvitation(token, user.id);
      if (result.success) {
        setStatus('accepted');
        toast.success('ইনভাইট গ্রহণ করা হয়েছে!');
        
        // Redirect to admin after 2 seconds
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'কিছু সমস্যা হয়েছে');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'কিছু সমস্যা হয়েছে');
    } finally {
      setIsAccepting(false);
    }
  };

  // Show loading while checking auth
  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">লোড হচ্ছে...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <LogIn className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>লগইন করুন</CardTitle>
            <CardDescription>
              ইনভাইট গ্রহণ করতে প্রথমে লগইন করুন
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
            >
              লগইন পেজে যান
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invitation not found
  if (status === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>ইনভাইট পাওয়া যায়নি</CardTitle>
            <CardDescription>
              এই ইনভাইট লিংকটি সঠিক নয় অথবা মেয়াদ শেষ হয়ে গেছে।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              হোমে ফিরে যান
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>সমস্যা হয়েছে</CardTitle>
            <CardDescription>
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              হোমে ফিরে যান
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Accepted state
  if (status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
            <CardTitle>স্বাগতম!</CardTitle>
            <CardDescription>
              আপনি সফলভাবে {invitation?.shops?.name || 'শপ'} টিমে যোগ হয়েছেন। ড্যাশবোর্ডে নিয়ে যাচ্ছি...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show invitation details
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 mx-auto text-primary mb-4" />
          <CardTitle>টিমে যোগ দিন</CardTitle>
          <CardDescription>
            আপনাকে <strong>{invitation?.shops?.name || 'একটি শপ'}</strong>-এর টিমে যোগ হতে আমন্ত্রণ জানানো হয়েছে
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            {invitation?.shops?.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">শপ:</span>
                <span className="font-medium">{invitation.shops.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">ইমেইল:</span>
              <span className="font-medium">{invitation?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">রোল:</span>
              <span className="font-medium capitalize">{invitation?.role}</span>
            </div>
          </div>

          <Button 
            className="w-full" 
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            ইনভাইট গ্রহণ করুন
          </Button>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/')}
          >
            বাতিল
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
