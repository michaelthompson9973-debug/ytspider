import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type ShopRole = 'owner' | 'admin' | 'manager' | 'editor' | 'support' | 'viewer';
export type ShopPlan = 'free' | 'pro' | 'enterprise';
export type ShopType = 'physical' | 'digital';

export type ShopStatus = 'active' | 'grace_period' | 'suspended' | 'cancelled';

export interface Shop {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  plan: ShopPlan;
  shop_type: ShopType;
  business_category: string | null;
  onboarding_completed: boolean;
  settings: Record<string, unknown>;
  is_active: boolean;
  status: ShopStatus;
  grace_period_ends_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopMember {
  id: string;
  shop_id: string;
  user_id: string;
  role: ShopRole;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
}

interface CreateShopOptions {
  shop_type?: ShopType;
  business_category?: string | null;
  onboarding_completed?: boolean;
}

interface ShopContextType {
  currentShop: Shop | null;
  availableShops: Shop[];
  userRole: ShopRole | null;
  isLoading: boolean;
  error: string | null;
  isPlatformMode: boolean;
  switchShop: (shopId: string) => Promise<void>;
  createShop: (name: string, customSlug?: string, options?: CreateShopOptions) => Promise<Shop>;
  refreshShops: () => Promise<void>;
  enterPlatformMode: () => void;
}

const STORAGE_KEY = 'ytspider-current-shop-id';

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [availableShops, setAvailableShops] = useState<Shop[]>([]);
  const [userRole, setUserRole] = useState<ShopRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const fetchShops = useCallback(async () => {
    if (!user) {
      setAvailableShops([]);
      setCurrentShop(null);
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data: shops, error: shopsError } = await supabase.rpc('get_user_shops');

      if (shopsError) {
        console.error('Error fetching shops:', shopsError);
        setError('Failed to load shops');
        return;
      }

      const typedShops: Shop[] = (shops || []).map((shop: Record<string, unknown>) => ({
        id: shop.id as string,
        name: shop.name as string,
        slug: shop.slug as string,
        logo_url: shop.logo_url as string | null,
        owner_id: shop.owner_id as string,
        plan: shop.plan as ShopPlan,
        shop_type: (shop.shop_type as ShopType) || 'physical',
        business_category: shop.business_category as string | null,
        onboarding_completed: shop.onboarding_completed as boolean ?? false,
        settings: (shop.settings || {}) as Record<string, unknown>,
        is_active: shop.is_active as boolean,
        status: (shop.status as ShopStatus) || 'active',
        grace_period_ends_at: shop.grace_period_ends_at as string | null,
        expires_at: shop.expires_at as string | null,
        created_at: shop.created_at as string,
        updated_at: shop.updated_at as string,
      }));

      setAvailableShops(typedShops);

      const savedShopId = localStorage.getItem(STORAGE_KEY);
      const savedShop = typedShops.find(s => s.id === savedShopId);

      if (savedShop) {
        setCurrentShop(savedShop);
        await fetchUserRole(savedShop.id);
      } else {
        setCurrentShop(null);
        setUserRole(null);
      }
    } catch (err) {
      console.error('Error in fetchShops:', err);
      setError('Failed to load shops');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserRole = async (shopId: string) => {
    if (!user) {
      setUserRole(null);
      return;
    }

    if (isAdmin) {
      setUserRole('owner');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shop_members')
        .select('role')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        return;
      }

      setUserRole((data?.role as ShopRole) || null);
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      setUserRole(null);
    }
  };

  const switchShop = async (shopId: string) => {
    const shop = availableShops.find(s => s.id === shopId);
    if (!shop) {
      throw new Error('Shop not found');
    }

    setCurrentShop(shop);
    localStorage.setItem(STORAGE_KEY, shopId);
    await fetchUserRole(shopId);
  };

  const createShop = async (
    name: string, 
    customSlug?: string, 
    options?: CreateShopOptions
  ): Promise<Shop> => {
    if (!user) {
      throw new Error('Please log in');
    }

    const slug = customSlug || generateSlug(name);

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .insert({
        name,
        slug,
        owner_id: user.id,
        plan: 'free',
        shop_type: options?.shop_type || 'physical',
        business_category: options?.business_category || null,
        onboarding_completed: options?.onboarding_completed || false,
        settings: {},
        is_active: true,
      })
      .select()
      .single();

    if (shopError) {
      console.error('Error creating shop:', shopError);
      if (shopError.code === '23505') {
        throw new Error('This slug is already in use');
      }
      throw new Error('Failed to create shop');
    }

    const { error: memberError } = await supabase
      .from('shop_members')
      .insert({
        shop_id: shop.id,
        user_id: user.id,
        role: 'owner',
        invited_by: user.id,
        accepted_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Error adding shop member:', memberError);
      await supabase.from('shops').delete().eq('id', shop.id);
      throw new Error('Failed to add shop member');
    }

    const newShop: Shop = {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      logo_url: shop.logo_url,
      owner_id: shop.owner_id,
      plan: shop.plan as ShopPlan,
      shop_type: (shop.shop_type as ShopType) || 'physical',
      business_category: shop.business_category,
      onboarding_completed: shop.onboarding_completed ?? false,
      settings: (shop.settings || {}) as Record<string, unknown>,
      is_active: shop.is_active,
      status: (shop.status as ShopStatus) || 'active',
      grace_period_ends_at: shop.grace_period_ends_at ?? null,
      expires_at: shop.expires_at ?? null,
      created_at: shop.created_at,
      updated_at: shop.updated_at,
    };

    setCurrentShop(newShop);
    setUserRole('owner');
    localStorage.setItem(STORAGE_KEY, newShop.id);
    
    setAvailableShops(prev => [...prev, newShop]);

    return newShop;
  };

  const refreshShops = async () => {
    setIsLoading(true);
    await fetchShops();
  };

  const enterPlatformMode = () => {
    setCurrentShop(null);
    setUserRole(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isPlatformMode = currentShop === null;

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('shop-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shops',
        },
        () => {
          fetchShops();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shop_members',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchShops();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchShops]);

  return (
    <ShopContext.Provider
      value={{
        currentShop,
        availableShops,
        userRole,
        isLoading,
        error,
        isPlatformMode,
        switchShop,
        createShop,
        refreshShops,
        enterPlatformMode,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}

export function useShopAccess(minRole: ShopRole = 'viewer'): boolean {
  const { userRole } = useShop();
  
  if (!userRole) return false;
  
  const hierarchy: ShopRole[] = ['viewer', 'support', 'editor', 'manager', 'admin', 'owner'];
  const minIndex = hierarchy.indexOf(minRole);
  const userIndex = hierarchy.indexOf(userRole);
  
  return userIndex >= minIndex;
}