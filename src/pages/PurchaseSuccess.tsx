import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PurchaseSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  
  const shopName = searchParams.get('shop') || '';
  const email = searchParams.get('email') || '';
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {language === 'bn' ? '🎉 অভিনন্দন!' : '🎉 Congratulations!'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'bn' 
                ? 'আপনার শপ সফলভাবে তৈরি হয়েছে'
                : 'Your shop has been created successfully'
              }
            </p>
          </div>
          
          {shopName && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">
                {language === 'bn' ? 'শপের নাম' : 'Shop Name'}
              </p>
              <p className="font-semibold text-lg">{shopName}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>
              {language === 'bn' 
                ? 'লগইন তথ্য আপনার ইমেইলে পাঠানো হয়েছে'
                : 'Login details have been sent to your email'
              }
            </span>
          </div>
          
          <Button 
            size="lg" 
            className="w-full gap-2"
            onClick={() => navigate('/auth')}
          >
            {language === 'bn' ? 'এখনই লগইন করুন' : 'Login Now'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
