export interface LibraryComponent {
  id: string;
  name: string;
  category: string;
  html: string;
  thumbnail_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const componentCategories = [
  { value: 'hero', label: 'Hero' },
  { value: 'features', label: 'Features' },
  { value: 'cta', label: 'CTA' },
  { value: 'faq', label: 'FAQ' },
  { value: 'testimonial', label: 'Testimonial' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'footer', label: 'Footer' },
  { value: 'general', label: 'General' },
] as const;

export type ComponentCategory = typeof componentCategories[number]['value'];
