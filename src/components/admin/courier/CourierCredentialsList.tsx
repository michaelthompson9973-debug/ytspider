import React, { useState } from 'react';
import { Eye, EyeOff, Trash2, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CourierCredential, useCourierCredentials } from '@/hooks/useCourierCredentials';

interface CredentialsListProps {
  provider: 'steadfast' | 'pathao';
}

const CREDENTIAL_TYPES = {
  steadfast: [
    { value: 'api_key', label: 'API Key' },
    { value: 'secret_key', label: 'Secret Key' },
  ],
  pathao: [
    { value: 'client_id', label: 'Client ID' },
    { value: 'client_secret', label: 'Client Secret' },
    { value: 'username', label: 'Username (Email)' },
    { value: 'password', label: 'Password' },
    { value: 'store_id', label: 'Store ID' },
  ],
};

export function CourierCredentialsList({ provider }: CredentialsListProps) {
  const { credentials, isLoading, addCredential, deleteCredential } = useCourierCredentials(provider);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCredType, setNewCredType] = useState('');
  const [newCredValue, setNewCredValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const toggleShowValue = (id: string) => {
    setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = async () => {
    if (!newCredType || !newCredValue) return;
    
    setIsAdding(true);
    const success = await addCredential(newCredType, newCredValue);
    setIsAdding(false);
    
    if (success) {
      setIsAddDialogOpen(false);
      setNewCredType('');
      setNewCredValue('');
    }
  };

  const maskValue = (value: string) => {
    if (value.length <= 4) return '****';
    return value.slice(0, 4) + '*'.repeat(Math.min(value.length - 4, 16));
  };

  const getCredentialLabel = (type: string) => {
    const types = CREDENTIAL_TYPES[provider];
    return types.find(t => t.value === type)?.label || type;
  };

  // Filter out access_token and refresh_token from display
  const displayCredentials = credentials.filter(
    c => !['access_token', 'refresh_token'].includes(c.credential_type)
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">API Credentials</CardTitle>
        <CardDescription>
          Manage your {provider === 'steadfast' ? 'Steadfast' : 'Pathao'} API credentials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayCredentials.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No credentials configured yet
          </p>
        ) : (
          <div className="space-y-3">
            {displayCredentials.map((cred) => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{getCredentialLabel(cred.credential_type)}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {showValues[cred.id] ? cred.credential_value : maskValue(cred.credential_value)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleShowValue(cred.id)}
                  >
                    {showValues[cred.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteCredential(cred.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Credential</DialogTitle>
              <DialogDescription>
                Add a new API credential for {provider === 'steadfast' ? 'Steadfast' : 'Pathao'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Credential Type</Label>
                <Select value={newCredType} onValueChange={setNewCredType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CREDENTIAL_TYPES[provider].map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type={newCredType === 'password' ? 'password' : 'text'}
                  value={newCredValue}
                  onChange={(e) => setNewCredValue(e.target.value)}
                  placeholder="Enter credential value"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isAdding || !newCredType || !newCredValue}>
                {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
