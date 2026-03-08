export interface LandingPage {
  id: string;
  slug: string;
  product_id: string | null;
  gtm_id: string | null;
  tracking_profile_id: string | null;
  published: boolean;
  html_content: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  products: { name: string } | null;
  tracking_profiles: { name: string } | null;
}

export interface PageForm {
  slug: string;
  product_id: string | null;
  gtm_id?: string;
  tracking_profile_id: string | null;
  published: boolean;
}

export type StatusFilter = 'all' | 'published' | 'draft';

export interface EnhancedStats {
  total: number;
  published: number;
  draft: number;
  thisWeek: number;
  totalOrders: number;
  totalRevenue: number;
  pageStats: Record<string, { orders: number; revenue: number }>;
}

export const defaultForm: PageForm = {
  slug: '',
  product_id: null,
  gtm_id: '',
  tracking_profile_id: null,
  published: false,
};
