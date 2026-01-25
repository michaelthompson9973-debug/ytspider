import { useState } from 'react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AiEnhanceButtonProps {
  html: string;
  onEnhanced: (enhancedHtml: string) => void;
  disabled?: boolean;
}

export function AiEnhanceButton({ html, onEnhanced, disabled }: AiEnhanceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  const handleEnhance = async () => {
    if (!html.trim()) {
      toast({
        title: "Error",
        description: "No HTML content to enhance",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhance-html`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            html,
            instruction: instruction.trim() || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance HTML');
      }

      if (data.enhancedHtml) {
        onEnhanced(data.enhancedHtml);
        setInstruction('');
        setIsOpen(false);
        toast({
          title: "Success",
          description: "HTML enhanced successfully!",
        });
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enhance HTML",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnhance();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground hover:text-primary transition-colors",
            isOpen && "text-primary bg-primary/10"
          )}
          disabled={disabled || isEnhancing}
          title="AI Enhance"
        >
          {isEnhancing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-3" 
        align="end"
        side="bottom"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Enhance
            </h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Enhance your HTML with AI. Instruction is optional.
          </p>

          <div className="flex gap-2">
            <Input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Make it more colorful..."
              className="h-9 text-sm"
              disabled={isEnhancing}
            />
            <Button
              size="sm"
              onClick={handleEnhance}
              disabled={isEnhancing}
              className="h-9 px-3"
            >
              {isEnhancing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
