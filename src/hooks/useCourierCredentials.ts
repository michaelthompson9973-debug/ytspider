import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CourierCredential {
  id: string;
  provider: 'steadfast' | 'pathao';
  credential_type: string;
  credential_value: string;
  label: string | null;
  is_active: boolean;
  access_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCourierCredentials(provider: 'steadfast' | 'pathao') {
  const [credentials, setCredentials] = useState<CourierCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('courier_credentials')
        .select('*')
        .eq('provider', provider)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCredentials((data as CourierCredential[]) || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      toast({
        title: 'Error',
        description: 'Failed to load credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [provider]);

  const addCredential = async (
    credentialType: string,
    credentialValue: string,
    label?: string
  ) => {
    try {
      const { error } = await supabase.from('courier_credentials').insert({
        provider,
        credential_type: credentialType,
        credential_value: credentialValue,
        label: label || credentialType,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Credential added successfully',
      });

      await fetchCredentials();
      return true;
    } catch (error) {
      console.error('Error adding credential:', error);
      toast({
        title: 'Error',
        description: 'Failed to add credential',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateCredential = async (id: string, updates: Partial<CourierCredential>) => {
    try {
      const { error } = await supabase
        .from('courier_credentials')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Credential updated successfully',
      });

      await fetchCredentials();
      return true;
    } catch (error) {
      console.error('Error updating credential:', error);
      toast({
        title: 'Error',
        description: 'Failed to update credential',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCredential = async (id: string) => {
    try {
      const { error } = await supabase
        .from('courier_credentials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Credential deleted successfully',
      });

      await fetchCredentials();
      return true;
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete credential',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getCredentialValue = (type: string): string | null => {
    const cred = credentials.find(c => c.credential_type === type);
    return cred?.credential_value || null;
  };

  const getTokenStatus = (): { valid: boolean; expiresAt: Date | null } => {
    const tokenCred = credentials.find(c => c.credential_type === 'access_token');
    if (!tokenCred?.access_token || !tokenCred?.token_expires_at) {
      return { valid: false, expiresAt: null };
    }
    const expiresAt = new Date(tokenCred.token_expires_at);
    return { valid: expiresAt > new Date(), expiresAt };
  };

  return {
    credentials,
    isLoading,
    addCredential,
    updateCredential,
    deleteCredential,
    getCredentialValue,
    getTokenStatus,
    refetch: fetchCredentials,
  };
}
