import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, EyeOff, Key } from 'lucide-react';

export default function ApiSettings() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('api_settings')
        .select('key_value')
        .eq('key_name', 'GEMINI_API_KEY')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setGeminiApiKey(data.key_value);
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!geminiApiKey.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Check if key exists
      const { data: existing } = await supabase
        .from('api_settings')
        .select('id')
        .eq('key_name', 'GEMINI_API_KEY')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('api_settings')
          .update({ key_value: geminiApiKey.trim() })
          .eq('key_name', 'GEMINI_API_KEY');

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('api_settings')
          .insert({ key_name: 'GEMINI_API_KEY', key_value: geminiApiKey.trim() });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "API key saved successfully",
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">API Settings</h1>
          <p className="text-muted-foreground">Manage your API keys for AI features</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Gemini API Key
            </CardTitle>
            <CardDescription>
              Enter your Google Gemini API key to enable AI-powered HTML enhancement.
              Get your API key from{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google AI Studio
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gemini-key">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="gemini-key"
                    type={showKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
