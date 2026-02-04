import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import { useAuth } from '@/contexts/AuthContext';
import { ExtendedShopRole } from './useShopPermissions';

export interface ShopInvitation {
  id: string;
  shop_id: string;
  email: string;
  role: ExtendedShopRole;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function useShopInvitations() {
  const { currentShop } = useShop();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending invitations
  const { data: invitations = [], isLoading, error } = useQuery({
    queryKey: ['shop-invitations', currentShop?.id],
    queryFn: async () => {
      if (!currentShop) return [];

      const { data, error } = await supabase
        .from('shop_invitations')
        .select('*')
        .eq('shop_id', currentShop.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShopInvitation[];
    },
    enabled: !!currentShop,
  });

  // Create invitation
  const createInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: ExtendedShopRole }) => {
      if (!currentShop || !user) throw new Error('No shop or user');

      // Check if invitation already exists
      const { data: existing } = await supabase
        .from('shop_invitations')
        .select('id')
        .eq('shop_id', currentShop.id)
        .eq('email', email)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (existing) {
        throw new Error('এই ইমেইলে ইতিমধ্যে ইনভাইট পাঠানো হয়েছে');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('shop_members')
        .select('id')
        .eq('shop_id', currentShop.id)
        .maybeSingle();

      // Generate token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { data, error } = await supabase
        .from('shop_invitations')
        .insert({
          shop_id: currentShop.id,
          email: email.toLowerCase().trim(),
          role,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as ShopInvitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-invitations', currentShop?.id] });
    },
  });

  // Cancel invitation
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('shop_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-invitations', currentShop?.id] });
    },
  });

  // Resend invitation (create new token, extend expiry)
  const resendInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const newToken = generateToken();
      const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('shop_invitations')
        .update({
          token: newToken,
          expires_at: newExpiry.toISOString(),
        })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-invitations', currentShop?.id] });
    },
  });

  // Get invitation by token (for accept-invite page)
  const getInvitationByToken = async (token: string): Promise<ShopInvitation | null> => {
    const { data, error } = await supabase
      .from('shop_invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;
    return data as ShopInvitation;
  };

  // Accept invitation
  const acceptInvitation = useMutation({
    mutationFn: async (token: string) => {
      if (!user) throw new Error('লগইন করুন');

      // Get invitation
      const invitation = await getInvitationByToken(token);
      if (!invitation) {
        throw new Error('ইনভাইটেশন খুঁজে পাওয়া যায়নি বা মেয়াদ শেষ');
      }

      // Add user to shop_members
      const { error: memberError } = await supabase
        .from('shop_members')
        .insert({
          shop_id: invitation.shop_id,
          user_id: user.id,
          role: invitation.role,
          invited_by: invitation.invited_by,
          accepted_at: new Date().toISOString(),
        });

      if (memberError) {
        if (memberError.code === '23505') {
          throw new Error('আপনি ইতিমধ্যে এই শপের মেম্বার');
        }
        throw memberError;
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('shop_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      return invitation;
    },
  });

  return {
    invitations,
    isLoading,
    error,
    createInvitation: createInvitation.mutateAsync,
    isCreating: createInvitation.isPending,
    cancelInvitation: cancelInvitation.mutateAsync,
    isCancelling: cancelInvitation.isPending,
    resendInvitation: resendInvitation.mutateAsync,
    isResending: resendInvitation.isPending,
    getInvitationByToken,
    acceptInvitation: acceptInvitation.mutateAsync,
    isAccepting: acceptInvitation.isPending,
  };
}
