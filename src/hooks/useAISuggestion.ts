import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AISuggestionResult {
  suggestion: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'keyword_rule' | 'ai_generated';
  matchedRule?: string;
}

interface ConversationMessage {
  role: 'customer' | 'page';
  content: string;
}

export function useAISuggestion() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestionResult | null>(null);

  const getSuggestion = useCallback(async (
    customerMessage: string,
    conversationHistory: ConversationMessage[] = [],
    connectionId?: string
  ) => {
    if (!customerMessage.trim()) {
      setSuggestion(null);
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-reply-suggest', {
        body: {
          customerMessage,
          conversationHistory,
          connectionId,
        },
      });

      if (error) {
        console.error('AI suggestion error:', error);
        if (error.message?.includes('429')) {
          toast.error('AI rate limit reached, please try again later');
        }
        return null;
      }

      const result = data as AISuggestionResult;
      setSuggestion(result);
      return result;
    } catch (err) {
      console.error('AI suggestion fetch error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
  }, []);

  return {
    isLoading,
    suggestion,
    getSuggestion,
    clearSuggestion,
  };
}
