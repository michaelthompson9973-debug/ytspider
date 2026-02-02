import { Button } from '@/components/ui/button';
import { Facebook, Loader2 } from 'lucide-react';

interface FacebookLoginButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function FacebookLoginButton({ onClick, isLoading, disabled }: FacebookLoginButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          লগইন হচ্ছে...
        </>
      ) : (
        <>
          <Facebook className="h-5 w-5" />
          Login with Facebook
        </>
      )}
    </Button>
  );
}
