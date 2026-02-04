import { useShop, ShopRole } from '@/contexts/ShopContext';

// Extended role type including new roles
export type ExtendedShopRole = 'owner' | 'admin' | 'manager' | 'editor' | 'support' | 'viewer';

// Permission definitions
export type Permission = 
  | 'shop.delete'
  | 'shop.settings'
  | 'shop.theme'
  | 'team.manage'
  | 'team.view'
  | 'billing.manage'
  | 'products.manage'
  | 'products.view'
  | 'orders.manage'
  | 'orders.view'
  | 'landing_pages.manage'
  | 'landing_pages.view'
  | 'messenger.manage'
  | 'messenger.view'
  | 'analytics.view'
  | 'audit_log.view';

// Role hierarchy (higher index = more permissions)
const roleHierarchy: ExtendedShopRole[] = [
  'viewer',
  'support',
  'editor',
  'manager',
  'admin',
  'owner',
];

// Default permissions for each role
const defaultPermissions: Record<ExtendedShopRole, Permission[]> = {
  owner: [
    'shop.delete',
    'shop.settings',
    'shop.theme',
    'team.manage',
    'team.view',
    'billing.manage',
    'products.manage',
    'products.view',
    'orders.manage',
    'orders.view',
    'landing_pages.manage',
    'landing_pages.view',
    'messenger.manage',
    'messenger.view',
    'analytics.view',
    'audit_log.view',
  ],
  admin: [
    'shop.settings',
    'shop.theme',
    'team.manage',
    'team.view',
    'products.manage',
    'products.view',
    'orders.manage',
    'orders.view',
    'landing_pages.manage',
    'landing_pages.view',
    'messenger.manage',
    'messenger.view',
    'analytics.view',
    'audit_log.view',
  ],
  manager: [
    'team.view',
    'products.manage',
    'products.view',
    'orders.manage',
    'orders.view',
    'landing_pages.manage',
    'landing_pages.view',
    'messenger.view',
    'analytics.view',
  ],
  editor: [
    'products.view',
    'products.manage',
    'orders.view',
    'landing_pages.manage',
    'landing_pages.view',
  ],
  support: [
    'orders.view',
    'messenger.manage',
    'messenger.view',
    'products.view',
  ],
  viewer: [
    'products.view',
    'orders.view',
    'landing_pages.view',
    'messenger.view',
    'analytics.view',
  ],
};

// Role labels in Bengali
export const roleLabels: Record<ExtendedShopRole, string> = {
  owner: 'Owner (মালিক)',
  admin: 'Admin (অ্যাডমিন)',
  manager: 'Manager (ম্যানেজার)',
  editor: 'Editor (এডিটর)',
  support: 'Support (সাপোর্ট)',
  viewer: 'Viewer (ভিউয়ার)',
};

// Role descriptions in Bengali
export const roleDescriptions: Record<ExtendedShopRole, string> = {
  owner: 'সম্পূর্ণ নিয়ন্ত্রণ - শপ ডিলিট সহ সব কিছু করতে পারবে',
  admin: 'টিম ম্যানেজ, সেটিংস পরিবর্তন করতে পারবে',
  manager: 'অর্ডার ও প্রোডাক্ট ম্যানেজ করতে পারবে',
  editor: 'কনটেন্ট ও ল্যান্ডিং পেজ এডিট করতে পারবে',
  support: 'কাস্টমার সাপোর্ট - মেসেঞ্জার ও অর্ডার দেখতে পারবে',
  viewer: 'শুধুমাত্র দেখতে পারবে',
};

export function useShopPermissions() {
  const { userRole } = useShop();

  // Check if user has a specific permission
  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    
    const role = userRole as ExtendedShopRole;
    const permissions = defaultPermissions[role] || [];
    return permissions.includes(permission);
  };

  // Check if user has minimum role
  const hasMinRole = (minRole: ExtendedShopRole): boolean => {
    if (!userRole) return false;
    
    const userIndex = roleHierarchy.indexOf(userRole as ExtendedShopRole);
    const minIndex = roleHierarchy.indexOf(minRole);
    
    return userIndex >= minIndex;
  };

  // Get all permissions for current role
  const getPermissions = (): Permission[] => {
    if (!userRole) return [];
    return defaultPermissions[userRole as ExtendedShopRole] || [];
  };

  // Check multiple permissions (AND logic)
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  // Check multiple permissions (OR logic)
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  return {
    userRole: userRole as ExtendedShopRole | null,
    hasPermission,
    hasMinRole,
    getPermissions,
    hasAllPermissions,
    hasAnyPermission,
    roleLabels,
    roleDescriptions,
    roleHierarchy,
  };
}

// Utility hook for protecting components
export function useRequirePermission(permission: Permission): boolean {
  const { hasPermission } = useShopPermissions();
  return hasPermission(permission);
}

// Utility hook for protecting by role
export function useRequireRole(minRole: ExtendedShopRole): boolean {
  const { hasMinRole } = useShopPermissions();
  return hasMinRole(minRole);
}
