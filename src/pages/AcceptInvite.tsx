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
        toast.success('Invitation accepted!');
        
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Something went wrong');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsAccepting(false);
    }
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <LogIn className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>
              You need to log in first to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Something Went Wrong</CardTitle>
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
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              You have successfully joined the {invitation?.shops?.name || 'shop'} team. Redirecting to dashboard...
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 mx-auto text-primary mb-4" />
          <CardTitle>Join Team</CardTitle>
          <CardDescription>
            You have been invited to join the <strong>{invitation?.shops?.name || 'a shop'}</strong> team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            {invitation?.shops?.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shop:</span>
                <span className="font-medium">{invitation.shops.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{invitation?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{invitation?.role}</span>
            </div>
          </div>

          <Button 
            className="w-full" 
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Accept Invitation
          </Button>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}