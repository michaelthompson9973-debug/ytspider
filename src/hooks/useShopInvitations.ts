import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import { useAuth } from '@/contexts/AuthContext';
import { ExtendedShopRole } from './useShopPermissions';
import { generateInviteToken } from '@/lib/invitationUtils';

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

export interface CreateInvitationResult {
  invitation: ShopInvitation;
  emailSent: boolean;
}

export interface ResendInvitationResult {
  token: string;
  emailSent: boolean;
}

/**
 * Hook for shop invitation management - requires ShopContext
 * Use this in admin pages where ShopProvider is available
 * 
 * For public pages like AcceptInvite, use functions from invitationUtils.ts instead
 */
export function useShopInvitations() {
  const { currentShop } = useShop();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending invitations for current shop
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
  const createInvitationMutation = useMutation<CreateInvitationResult, Error, { email: string; role: ExtendedShopRole }>({
    mutationFn: async ({ email, role }) => {
      if (!currentShop || !user) throw new Error('No shop or user');

      const normalizedEmail = email.toLowerCase().trim();

      // Check if invitation already exists
      const { data: existing } = await supabase
        .from('shop_invitations')
        .select('id')
        .eq('shop_id', currentShop.id)
        .eq('email', normalizedEmail)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (existing) {
        throw new Error('এই ইমেইলে ইতিমধ্যে ইনভাইট পাঠানো হয়েছে');
      }

      // Generate token
      const token = generateInviteToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { data, error } = await supabase
        .from('shop_invitations')
        .insert({
          shop_id: currentShop.id,
          email: normalizedEmail,
          role,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      let emailSent = true;
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            email: normalizedEmail,
            shopName: currentShop.name,
            role,
            token,
            inviterName: user.email,
          },
        });

        if (emailError) {
          emailSent = false;
          console.error('Failed to send invitation email:', emailError);
        }
      } catch (emailErr) {
        emailSent = false;
        console.error('Failed to send invitation email:', emailErr);
      }

      return {
        invitation: data as ShopInvitation,
        emailSent,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-invitations', currentShop?.id] });
    },
  });

  // Cancel invitation
  const cancelInvitationMutation = useMutation({
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

  // Resend invitation (create new token, extend expiry, and resend email)
  const resendInvitationMutation = useMutation<ResendInvitationResult, Error, string>({
    mutationFn: async (invitationId: string) => {
      if (!currentShop || !user) throw new Error('No shop or user');

      // First get the invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('shop_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchError || !invitation) throw new Error('Invitation not found');

      const newToken = generateInviteToken();
      const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('shop_invitations')
        .update({
          token: newToken,
          expires_at: newExpiry.toISOString(),
        })
        .eq('id', invitationId);

      if (error) throw error;

      // Send invitation email again
      let emailSent = true;
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            email: invitation.email,
            shopName: currentShop.name,
            role: invitation.role,
            token: newToken,
            inviterName: user.email,
          },
        });

        if (emailError) {
          emailSent = false;
          console.error('Failed to send invitation email:', emailError);
        }
      } catch (emailErr) {
        emailSent = false;
        console.error('Failed to send invitation email:', emailErr);
      }

      return {
        token: newToken,
        emailSent,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-invitations', currentShop?.id] });
    },
  });

  return {
    invitations,
    isLoading,
    error,
    createInvitation: createInvitationMutation.mutateAsync,
    isCreating: createInvitationMutation.isPending,
    cancelInvitation: cancelInvitationMutation.mutateAsync,
    isCancelling: cancelInvitationMutation.isPending,
    resendInvitation: resendInvitationMutation.mutateAsync,
    isResending: resendInvitationMutation.isPending,
  };
}
