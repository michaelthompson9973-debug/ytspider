import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Trash2, Loader2, Save, Check } from 'lucide-react';
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
import { useCourierCredentials } from '@/hooks/useCourierCredentials';

interface CredentialsListProps {
  provider: 'steadfast' | 'pathao';
}

const STEADFAST_FIELDS = [
  { key: 'api_key', label: 'API Key', placeholder: 'Enter your Steadfast API Key', isPassword: false },
  { key: 'secret_key', label: 'Secret Key', placeholder: 'Enter your Steadfast Secret Key', isPassword: true },
];

const PATHAO_FIELDS = [
  { key: 'client_id', label: 'Client ID', placeholder: 'Enter Pathao Client ID' },
  { key: 'client_secret', label: 'Client Secret', placeholder: 'Enter Pathao Client Secret', isPassword: true },
];

export function CourierCredentialsList({ provider }: CredentialsListProps) {
  const { credentials, isLoading, addCredential, updateCredential, deleteCredential } = useCourierCredentials(provider);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedFields, setSavedFields] = useState<Record<string, boolean>>({});

  const fields = provider === 'steadfast' ? STEADFAST_FIELDS : PATHAO_FIELDS;

  // Initialize form values from existing credentials
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    credentials.forEach(cred => {
      if (!['access_token', 'refresh_token'].includes(cred.credential_type)) {
        initialValues[cred.credential_type] = cred.credential_value;
      }
    });
    setFormValues(initialValues);
  }, [credentials]);

  const toggleShowValue = (key: string) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    // Clear saved indicator when user types
    setSavedFields(prev => ({ ...prev, [key]: false }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const newSavedFields: Record<string, boolean> = {};

    for (const field of fields) {
      const value = formValues[field.key]?.trim();
      if (!value) continue;

      const existingCred = credentials.find(c => c.credential_type === field.key);
      
      if (existingCred) {
        if (existingCred.credential_value !== value) {
          await updateCredential(existingCred.id, { credential_value: value });
          newSavedFields[field.key] = true;
        }
      } else {
        await addCredential(field.key, value, field.label);
        newSavedFields[field.key] = true;
      }
    }

    setSavedFields(newSavedFields);
    setIsSaving(false);

    // Clear saved indicators after 2 seconds
    setTimeout(() => setSavedFields({}), 2000);
  };

  const handleDelete = async (key: string) => {
    const cred = credentials.find(c => c.credential_type === key);
    if (cred) {
      await deleteCredential(cred.id);
      setFormValues(prev => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });
    }
  };

  const hasAnyValue = fields.some(f => formValues[f.key]?.trim());
  const hasChanges = fields.some(f => {
    const existingCred = credentials.find(c => c.credential_type === f.key);
    const currentValue = formValues[f.key]?.trim() || '';
    const savedValue = existingCred?.credential_value || '';
    return currentValue !== savedValue;
  });

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
          Enter your {provider === 'steadfast' ? 'Steadfast' : 'Pathao'} API credentials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const existingCred = credentials.find(c => c.credential_type === field.key);
          const isPasswordField = field.isPassword || field.key.includes('secret') || field.key.includes('password');
          const showValue = showValues[field.key];
          const isSaved = savedFields[field.key];

          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key} className="text-sm font-medium">
                {field.label}
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={field.key}
                    type={isPasswordField && !showValue ? 'password' : 'text'}
                    value={formValues[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="pr-10"
                  />
                  {isPasswordField && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => toggleShowValue(field.key)}
                    >
                      {showValue ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                </div>
                {existingCred && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleDelete(field.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {isSaved && (
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
          className="w-full mt-4"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Credentials
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
