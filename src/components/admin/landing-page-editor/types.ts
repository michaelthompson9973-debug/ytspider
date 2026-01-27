export type SectionType = 'html' | 'checkout';

// Checkout Field Configuration
export interface CheckoutField {
  id: string;
  name: string;           // field name (customer_name, customer_phone, etc.)
  type: 'text' | 'tel' | 'email' | 'textarea';
  label: string;          // "আপনার নাম"
  placeholder: string;    // "সম্পূর্ণ নাম লিখুন"
  required: boolean;
  enabled: boolean;
}

export const defaultCheckoutFields: CheckoutField[] = [
  { id: 'name', name: 'customer_name', type: 'text', label: 'আপনার নাম', placeholder: 'সম্পূর্ণ নাম লিখুন', required: true, enabled: true },
  { id: 'phone', name: 'customer_phone', type: 'tel', label: 'মোবাইল নম্বর', placeholder: '01XXXXXXXXX', required: true, enabled: true },
  { id: 'address', name: 'customer_address', type: 'text', label: 'ডেলিভারি ঠিকানা', placeholder: 'বাড়ি নং, রাস্তা, এলাকা', required: true, enabled: true },
  { id: 'city', name: 'customer_city', type: 'text', label: 'শহর/জেলা', placeholder: 'ঢাকা', required: true, enabled: true },
];

export interface CheckoutConfig {
  title: string;
  ctaText: string;
  enabled: boolean;
  fields: CheckoutField[];  // Dynamic form fields
}

export const defaultCheckoutConfig: CheckoutConfig = {
  title: 'অর্ডার করুন',
  ctaText: 'অর্ডার সম্পন্ন করুন',
  enabled: true,
  fields: defaultCheckoutFields,
};

export interface Section {
  id: string;
  landing_page_id: string;
  name: string;
  html: string;
  sort_order: number;
  created_at: string;
  type: SectionType;
  config: CheckoutConfig | null;
}

export interface ThemeConfig {
  // Colors
  primaryColor: string;
  backgroundColor: string;
  
  // Typography
  headingFont: string;
  bodyFont: string;
  buttonFont: string;
  digitFont: string;
  
  // Layout
  buttonStyle: 'rounded' | 'square' | 'pill';
  borderRadius: string;
  containerWidth: string;
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
  backgroundColor: '#ffffff',
  headingFont: 'Hind Siliguri',
  bodyFont: 'Anek Bangla',
  buttonFont: 'Inter',
  digitFont: 'Poppins',
  buttonStyle: 'rounded',
  borderRadius: '8px',
  containerWidth: '1200px',
};

// Available fonts with Google Fonts URLs
export const availableFonts = [
  { value: 'Hind Siliguri', label: 'Hind Siliguri (বাংলা)', url: 'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap' },
  { value: 'Anek Bangla', label: 'Anek Bangla (বাংলা)', url: 'https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@300;400;500;600;700&display=swap' },
  { value: 'Inter', label: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { value: 'Poppins', label: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
  { value: 'Roboto', label: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' },
  { value: 'Open Sans', label: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap' },
  { value: 'Montserrat', label: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap' },
  { value: 'Lato', label: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
];

export const buttonStyles = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'square', label: 'Square' },
  { value: 'pill', label: 'Pill' },
];

// Legacy export for backward compatibility
export const fontFamilies = availableFonts.map(f => ({ value: f.value, label: f.label }));

// Checkout Settings Types (separate from Theme)
export type DeliveryMode = 'flat' | 'conditional' | 'free' | 'zoned';

export interface CheckoutSettings {
  id: string;
  landing_page_id: string;
  currency: string;
  delivery_mode: DeliveryMode;
  delivery_amount: number;
  free_over_amount: number | null;
  // Zone-based delivery fields
  inside_city_label: string;
  inside_city_amount: number;
  outside_city_label: string;
  outside_city_amount: number;
  created_at: string;
  updated_at: string;
}

export const defaultCheckoutSettings: Omit<CheckoutSettings, 'id' | 'landing_page_id' | 'created_at' | 'updated_at'> = {
  currency: 'BDT',
  delivery_mode: 'flat',
  delivery_amount: 60,
  free_over_amount: null,
  inside_city_label: 'ঢাকার মধ্যে',
  inside_city_amount: 60,
  outside_city_label: 'ঢাকার বাহিরে',
  outside_city_amount: 120,
};

export const currencyOptions = [
  { value: 'BDT', label: '৳ BDT', symbol: '৳' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'INR', label: '₹ INR', symbol: '₹' },
];

export const deliveryModeOptions = [
  { value: 'flat', label: 'Flat Charge', description: 'Fixed delivery fee for all orders' },
  { value: 'conditional', label: 'Free Above Amount', description: 'Free delivery if order exceeds threshold' },
  { value: 'free', label: 'Always Free', description: 'No delivery charge' },
  { value: 'zoned', label: 'Zone Based', description: 'Different charges for inside/outside city' },
];
