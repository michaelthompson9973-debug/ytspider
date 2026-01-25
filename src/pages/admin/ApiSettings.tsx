import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, EyeOff, Key, Plus, Trash2, Copy, Download, Upload, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  provider: string;
  status: string;
  last_used_at: string | null;
  rate_limited_until: string | null;
  usage_count: number;
  created_at: string;
}

export default function ApiSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('provider', 'gemini')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys((data as ApiKey[]) || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: "Error",
        description: "Failed to fetch API keys",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKey = async () => {
    if (!newKeyValue.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('api_keys')
        .insert({
          key_name: newKeyName.trim() || 'Gemini API Key',
          key_value: newKeyValue.trim(),
          provider: 'gemini',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "API key added successfully",
      });
      setNewKeyName('');
      setNewKeyValue('');
      fetchApiKeys();
    } catch (error) {
      console.error('Error adding API key:', error);
      toast({
        title: "Error",
        description: "Failed to add API key",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBatchImport = async () => {
    const lines = batchInput.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      toast({
        title: "Error",
        description: "No valid API keys found",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const keysToInsert = lines.map((line, index) => ({
        key_name: `Gemini API Key ${apiKeys.length + index + 1}`,
        key_value: line.trim(),
        provider: 'gemini',
      }));

      const { error } = await supabase
        .from('api_keys')
        .insert(keysToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${lines.length} API keys imported successfully`,
      });
      setBatchInput('');
      setIsBatchDialogOpen(false);
      fetchApiKeys();
    } catch (error) {
      console.error('Error importing API keys:', error);
      toast({
        title: "Error",
        description: "Failed to import API keys",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const handleResetStatus = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ 
          status: 'active', 
          rate_limited_until: null 
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "API key status reset to active",
      });
      fetchApiKeys();
    } catch (error) {
      console.error('Error resetting API key status:', error);
      toast({
        title: "Error",
        description: "Failed to reset API key status",
        variant: "destructive",
      });
    }
  };

  const handleCopyAll = () => {
    const allKeys = apiKeys.map(k => k.key_value).join('\n');
    navigator.clipboard.writeText(allKeys);
    toast({
      title: "Copied!",
      description: `${apiKeys.length} API keys copied to clipboard`,
    });
  };

  const handleExport = () => {
    const allKeys = apiKeys.map(k => k.key_value).join('\n');
    const blob = new Blob([allKeys], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gemini-api-keys.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Exported!",
      description: `${apiKeys.length} API keys exported to file`,
    });
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'rate_limited':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Rate Limited</Badge>;
      case 'invalid':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Invalid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">API Settings</h1>
          <p className="text-muted-foreground">Manage your API keys for AI features. Multiple keys enable automatic failover on rate limits.</p>
        </div>

        {/* Add New Key */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New API Key
            </CardTitle>
            <CardDescription>
              Add a new Gemini API key. Get your API key from{' '}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="key-name">Name (Optional)</Label>
                <Input
                  id="key-name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Primary Key, Backup Key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-value">API Key</Label>
                <Input
                  id="key-value"
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="Enter your Gemini API key"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleAddKey} disabled={isSaving || !newKeyValue.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Key
              </Button>
              
              <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Batch Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Batch Import API Keys</DialogTitle>
                    <DialogDescription>
                      Paste multiple API keys, one per line. They will be imported automatically.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      placeholder="Paste API keys here, one per line..."
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBatchImport} disabled={isSaving || !batchInput.trim()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import {batchInput.trim().split('\n').filter(l => l.trim()).length} Keys
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Existing Keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys ({apiKeys.length})
                </CardTitle>
                <CardDescription>
                  Manage your stored API keys. The system will automatically switch to the next available key if one hits rate limits.
                </CardDescription>
              </div>
              {apiKeys.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyAll}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No API keys configured. Add your first key above.
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key, index) => (
                  <div 
                    key={key.id} 
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{key.key_name || `Key ${index + 1}`}</span>
                        {getStatusBadge(key.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-muted-foreground font-mono">
                          {showKeys[key.id] ? key.key_value : maskKey(key.key_value)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleShowKey(key.id)}
                        >
                          {showKeys[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Used {key.usage_count} times
                        {key.last_used_at && ` • Last used: ${new Date(key.last_used_at).toLocaleString()}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {key.status === 'rate_limited' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetStatus(key.id)}
                          title="Reset status to active"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(key.key_value);
                          toast({ title: "Copied!", description: "API key copied to clipboard" });
                        }}
                        title="Copy key"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
