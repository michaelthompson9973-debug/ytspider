import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

export default function PurchaseSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  
  const status = searchParams.get('status') || 'success';
  const invoice = searchParams.get('invoice') || '';
  
  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';
  const isFailed = status === 'failed' || status === 'error';

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4 pt-20">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              isSuccess ? 'bg-primary/10' : isCancelled ? 'bg-amber-100' : 'bg-destructive/10'
            }`}>
              {isSuccess ? (
                <CheckCircle2 className="h-10 w-10 text-primary" />
              ) : isCancelled ? (
                <AlertCircle className="h-10 w-10 text-amber-500" />
              ) : (
                <XCircle className="h-10 w-10 text-destructive" />
              )}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {isSuccess 
                  ? (language === 'bn' ? '🎉 পেমেন্ট সফল!' : '🎉 Payment Successful!')
                  : isCancelled
                  ? (language === 'bn' ? 'পেমেন্ট বাতিল হয়েছে' : 'Payment Cancelled')
                  : (language === 'bn' ? 'পেমেন্ট ব্যর্থ হয়েছে' : 'Payment Failed')
                }
              </h1>
              <p className="text-muted-foreground">
                {isSuccess 
                  ? (language === 'bn' 
                    ? 'আপনার প্ল্যান সফলভাবে আপগ্রেড হয়েছে। এখন আপনি সব ফিচার ব্যবহার করতে পারবেন।'
                    : 'Your plan has been upgraded successfully. You now have access to all features.')
                  : isCancelled
                  ? (language === 'bn' 
                    ? 'আপনি পেমেন্ট বাতিল করেছেন। আবার চেষ্টা করুন।'
                    : 'You cancelled the payment. Please try again.')
                  : (language === 'bn'
                    ? 'পেমেন্ট প্রসেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
                    : 'There was an issue processing your payment. Please try again.')
                }
              </p>
            </div>

            {invoice && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Invoice: {invoice}</p>
              </div>
            )}

            <div className="space-y-3">
              {isSuccess ? (
                <Button 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={() => navigate('/shop')}
                >
                  {language === 'bn' ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="w-full gap-2"
                    onClick={() => navigate('/pricing')}
                  >
                    {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate('/shop')}
                  >
                    {language === 'bn' ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard'}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
