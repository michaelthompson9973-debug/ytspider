import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ShopInvitation = Database['public']['Tables']['shop_invitations']['Row'];
type ShopRole = Database['public']['Enums']['shop_role'];

export interface InvitationWithShop extends ShopInvitation {
  shops?: {
    name: string;
    logo_url: string | null;
  } | null;
}

/**
 * Get invitation by token - works without ShopContext
 * Used by AcceptInvite page which is public
 */
export async function getInvitationByToken(token: string): Promise<InvitationWithShop | null> {
  const { data, error } = await supabase
    .from('shop_invitations')
    .select(`
      *,
      shops:shop_id (
        name,
        logo_url
      )
    `)
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return data as InvitationWithShop;
}

/**
 * Accept invitation by token - works without ShopContext
 * Creates shop_member entry and marks invitation as accepted
 */
export async function acceptInvitation(token: string, userId: string): Promise<{
  success: boolean;
  shopId?: string;
  error?: string;
}> {
  // First get the invitation
  const { data: invitation, error: fetchError } = await supabase
    .from('shop_invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (fetchError || !invitation) {
    return { success: false, error: 'Invalid or expired invitation' };
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('shop_members')
    .select('id')
    .eq('shop_id', invitation.shop_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMember) {
    // Update invitation as accepted anyway
    await supabase
      .from('shop_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);
    
    return { success: true, shopId: invitation.shop_id, error: 'Already a member' };
  }

  // Add user to shop_members
  const { error: memberError } = await supabase
    .from('shop_members')
    .insert({
      shop_id: invitation.shop_id,
      user_id: userId,
      role: invitation.role as ShopRole,
      invited_by: invitation.invited_by,
      accepted_at: new Date().toISOString(),
    });

  if (memberError) {
    return { success: false, error: memberError.message };
  }

  // Mark invitation as accepted
  await supabase
    .from('shop_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id);

  return { success: true, shopId: invitation.shop_id };
}

/**
 * Generate a unique invitation token
 */
export function generateInviteToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
