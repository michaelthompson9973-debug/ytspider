import { Globe } from 'lucide-react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  const options: { value: Language; label: string }[] = [
    { value: 'bn', label: 'বাংলা' },
    { value: 'en', label: 'English' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-4 w-4" />
        <span>{t('settings.language')}</span>
      </div>
      <div className="flex gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={language === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage(option.value)}
            className={cn(
              'min-w-24 transition-all duration-200',
              language === option.value && 'ring-2 ring-primary ring-offset-2'
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
