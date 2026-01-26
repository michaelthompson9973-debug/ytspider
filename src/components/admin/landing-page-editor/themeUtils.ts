import { ThemeConfig, availableFonts, defaultThemeConfig, CheckoutConfig, defaultCheckoutConfig, CheckoutField, defaultCheckoutFields } from './types';

/**
 * Get Google Fonts import URLs for the theme fonts
 */
export function getGoogleFontsImports(config: ThemeConfig): string[] {
  const usedFonts = new Set([
    config.headingFont,
    config.bodyFont,
    config.buttonFont,
    config.digitFont,
  ]);

  return availableFonts
    .filter(font => usedFonts.has(font.value))
    .map(font => font.url);
}

/**
 * Generate CSS variables from theme config
 */
export function generateThemeCSS(config: ThemeConfig): string {
  const buttonRadius = config.buttonStyle === 'pill' 
    ? '9999px' 
    : config.buttonStyle === 'square' 
    ? '0' 
    : config.borderRadius;

  return `
/* Theme CSS Variables - Tailwind Compatible */
:root {
  --theme-primary: ${config.primaryColor};
  --theme-bg: ${config.backgroundColor};
  --theme-radius: ${config.borderRadius};
  --theme-btn-radius: ${buttonRadius};
  --theme-container: ${config.containerWidth};
  
  /* Typography */
  --font-heading: '${config.headingFont}', sans-serif;
  --font-body: '${config.bodyFont}', sans-serif;
  --font-button: '${config.buttonFont}', sans-serif;
  --font-digit: '${config.digitFont}', sans-serif;
}

/* Global Smooth Scrolling */
html {
  scroll-behavior: smooth;
}

/* Base Styles */
body {
  font-family: var(--font-body);
  background-color: var(--theme-bg);
  margin: 0;
  padding: 0;
}

/* Typography Classes */
.font-heading, h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

.font-body, p, span, div, li, td, th {
  font-family: var(--font-body);
}

.font-button, button, .btn, [class*="button"], input[type="submit"] {
  font-family: var(--font-button);
}

.font-digit {
  font-family: var(--font-digit);
}

/* Container */
.container {
  max-width: var(--theme-container);
  margin: 0 auto;
}

/* Theme Color Utilities */
.text-primary, a { color: var(--theme-primary); }
.bg-primary { background-color: var(--theme-primary); }
.border-primary { border-color: var(--theme-primary); }

/* Button Styles */
button, .btn, [class*="button"] {
  border-radius: var(--theme-btn-radius);
}

/* Form Elements */
input, textarea, select {
  border-radius: var(--theme-radius);
}

/* Theme Utilities */
.rounded-theme {
  border-radius: var(--theme-radius);
}
`.trim();
}

/**
 * Generate full HTML document with theme
 */
export function generateFullHTML(
  sectionsHtml: string, 
  themeConfig: ThemeConfig, 
  gtmId?: string
): string {
  const fontImports = getGoogleFontsImports(themeConfig);
  const themeCSS = generateThemeCSS(themeConfig);

  const gtmHead = gtmId ? `
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');</script>
    <!-- End Google Tag Manager -->
  ` : '';

  const gtmBody = gtmId ? `
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
  ` : '';

  const fontLinks = fontImports
    .map(url => `<link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="${url}" rel="stylesheet">`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  
  <!-- Google Fonts -->
  ${fontLinks}
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Theme Styles -->
  <style>
${themeCSS}
  </style>
  ${gtmHead}
</head>
<body>
  ${gtmBody}
  ${sectionsHtml}
</body>
</html>`;
}

/**
 * Generate preview HTML for iframe (without GTM)
 */
export function generatePreviewHTML(
  sectionsHtml: string, 
  themeConfig: ThemeConfig
): string {
  const fontImports = getGoogleFontsImports(themeConfig);
  const themeCSS = generateThemeCSS(themeConfig);

  const fontLinks = fontImports
    .map(url => `<link href="${url}" rel="stylesheet">`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${fontLinks}
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
${themeCSS}
  </style>
</head>
<body>
  ${sectionsHtml}
</body>
</html>`;
}

/**
 * Migrate old theme config to new format
 */
export function migrateThemeConfig(oldConfig: Partial<ThemeConfig>): ThemeConfig {
  return {
    primaryColor: oldConfig.primaryColor ?? defaultThemeConfig.primaryColor,
    backgroundColor: oldConfig.backgroundColor ?? defaultThemeConfig.backgroundColor,
    headingFont: oldConfig.headingFont ?? (oldConfig as any).fontFamily?.split(',')[0]?.trim() ?? defaultThemeConfig.headingFont,
    bodyFont: oldConfig.bodyFont ?? defaultThemeConfig.bodyFont,
    buttonFont: oldConfig.buttonFont ?? defaultThemeConfig.buttonFont,
    digitFont: oldConfig.digitFont ?? defaultThemeConfig.digitFont,
    buttonStyle: oldConfig.buttonStyle ?? defaultThemeConfig.buttonStyle,
    borderRadius: oldConfig.borderRadius ?? defaultThemeConfig.borderRadius,
    containerWidth: oldConfig.containerWidth ?? defaultThemeConfig.containerWidth,
  };
}

/**
 * Product data interface for checkout preview
 */
export interface ProductPreviewData {
  name: string;
  price: number;
  images?: string[] | null;
}

export interface CheckoutSettingsPreviewData {
  currency: string;
  delivery_mode: string;
  delivery_amount: number;
  free_over_amount: number | null;
}

/**
 * Generate checkout form preview HTML for admin preview
 */
export function generateCheckoutPreviewHTML(
  config: CheckoutConfig = defaultCheckoutConfig,
  themeConfig: ThemeConfig = defaultThemeConfig,
  product?: ProductPreviewData | null,
  checkoutSettings?: CheckoutSettingsPreviewData | null
): string {
  const buttonRadius = themeConfig.buttonStyle === 'pill' 
    ? '9999px' 
    : themeConfig.buttonStyle === 'square' 
    ? '0' 
    : themeConfig.borderRadius;

  // Use actual product data or placeholders
  const productName = product?.name || 'Product Name';
  const productPrice = product?.price || 0;
  const productImage = product?.images?.[0] || null;
  
  // Checkout settings
  const deliveryAmount = checkoutSettings?.delivery_amount ?? 60;
  const currencySymbol = checkoutSettings?.currency === 'USD' ? '$' : checkoutSettings?.currency === 'INR' ? '₹' : '৳';
  
  // Calculate totals (assuming quantity = 1 for preview)
  const subtotal = productPrice;
  const total = subtotal + deliveryAmount;

  // Get enabled fields
  const fields = config.fields?.filter(f => f.enabled) || defaultCheckoutFields;
  
  // Generate form fields HTML
  const formFieldsHtml = fields.map(field => `
    <input 
      style="width: 100%; border-radius: ${themeConfig.borderRadius}; border: 1px solid #d1d5db; padding: 0.625rem 0.75rem; font-family: var(--font-body); background: #f9fafb;" 
      placeholder="${field.placeholder}" 
      disabled 
    />
  `).join('\n');

  // Product image HTML
  const productImageHtml = productImage 
    ? `<img src="${productImage}" alt="${productName}" style="width: 100%; height: 120px; object-fit: cover; border-radius: ${themeConfig.borderRadius}; margin-bottom: 0.75rem;" />`
    : `<div style="width: 100%; height: 120px; background: #e5e7eb; border-radius: ${themeConfig.borderRadius}; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-family: var(--font-body);">
        Product Image
      </div>`;

  return `
    <section class="py-12 px-4" style="background-color: #f9fafb;" id="checkout">
      <div class="container max-w-md mx-auto">
        <div style="border-radius: ${themeConfig.borderRadius}; background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 1.5rem;">
          <h2 style="font-family: var(--font-heading); color: ${themeConfig.primaryColor}; font-size: 1.5rem; font-weight: 600; text-align: center; margin-bottom: 1rem;">
            ${config.title || 'অর্ডার করুন'}
          </h2>
          
          <!-- Product section -->
          <div style="margin-bottom: 1.5rem; padding: 1rem; border-radius: ${themeConfig.borderRadius}; background: #f9fafb; border: 1px solid #e5e7eb;">
            ${productImageHtml}
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-family: var(--font-body); color: #374151; font-weight: 500;">${productName}</span>
              <span style="font-family: var(--font-digit); color: ${themeConfig.primaryColor}; font-weight: 700;">${currencySymbol}${productPrice.toLocaleString()}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 0.75rem;">
              <button style="width: 2rem; height: 2rem; border-radius: ${buttonRadius}; border: 1px solid #d1d5db; background: white; cursor: pointer;">−</button>
              <span style="font-family: var(--font-digit); font-weight: 500; min-width: 2rem; text-align: center;">1</span>
              <button style="width: 2rem; height: 2rem; border-radius: ${buttonRadius}; border: 1px solid #d1d5db; background: white; cursor: pointer;">+</button>
            </div>
          </div>
          
          <!-- Price breakdown -->
          <div style="margin-bottom: 1rem; padding: 0.75rem; background: #f9fafb; border-radius: ${themeConfig.borderRadius}; font-family: var(--font-body); font-size: 0.875rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span>সাবটোটাল:</span>
              <span style="font-family: var(--font-digit);">${currencySymbol}${subtotal.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span>ডেলিভারি:</span>
              <span style="font-family: var(--font-digit);">${currencySymbol}${deliveryAmount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 600; padding-top: 0.5rem; border-top: 1px solid #e5e7eb;">
              <span>সর্বমোট:</span>
              <span style="font-family: var(--font-digit); color: ${themeConfig.primaryColor};">${currencySymbol}${total.toLocaleString()}</span>
            </div>
          </div>
          
          <!-- Form fields preview -->
          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
            ${formFieldsHtml}
          </div>
          
          <button style="width: 100%; background: ${themeConfig.primaryColor}; color: white; padding: 0.875rem; border-radius: ${buttonRadius}; font-family: var(--font-button); font-weight: 600; border: none; cursor: pointer;">
            ${config.ctaText || 'অর্ডার সম্পন্ন করুন'}
          </button>
        </div>
      </div>
    </section>
  `.trim();
}
