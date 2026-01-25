export interface Section {
  id: string;
  landing_page_id: string;
  name: string;
  html: string;
  sort_order: number;
  created_at: string;
}

export interface ThemeConfig {
  primaryColor: string;
  fontFamily: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
  borderRadius: string;
  containerWidth: string;
  backgroundColor: string;
}

export interface LandingPageTheme {
  id: string;
  landing_page_id: string;
  config: ThemeConfig;
  created_at: string;
  updated_at: string;
}

export const defaultThemeConfig: ThemeConfig = {
  primaryColor: '#3B82F6',
  fontFamily: 'Inter, sans-serif',
  buttonStyle: 'rounded',
  borderRadius: '8px',
  containerWidth: '1200px',
  backgroundColor: '#ffffff',
};

export const fontFamilies = [
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Arial, sans-serif', label: 'Arial' },
];

export const buttonStyles = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'square', label: 'Square' },
  { value: 'pill', label: 'Pill' },
];
