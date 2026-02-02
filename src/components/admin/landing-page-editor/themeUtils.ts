import { ThemeConfig, availableFonts, defaultThemeConfig, CheckoutConfig, defaultCheckoutConfig, CheckoutField, defaultCheckoutFields } from './types';

// Fonts that are locally hosted (no external URL needed)
const locallyHostedFonts = ['Hind Siliguri', 'Anek Bangla', 'Inter'];

/**
 * Generate local font faces CSS with absolute URLs
 * Uses absolute URLs so fonts work in srcdoc iframes
 */
export function getLocalFontFacesCSS(baseUrl: string = ''): string {
  // Use provided baseUrl or try to get from window.location.origin
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  
  return `
/* Hind Siliguri - Bangla Heading Font */
@font-face {
  font-family: 'Hind Siliguri';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${origin}/fonts/hind-siliguri-400.woff2') format('woff2');
}
@font-face {
  font-family: 'Hind Siliguri';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('${origin}/fonts/hind-siliguri-500.woff2') format('woff2');
}
@font-face {
  font-family: 'Hind Siliguri';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('${origin}/fonts/hind-siliguri-600.woff2') format('woff2');
}
@font-face {
  font-family: 'Hind Siliguri';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('${origin}/fonts/hind-siliguri-700.woff2') format('woff2');
}

/* Anek Bangla - Bangla Body Font */
@font-face {
  font-family: 'Anek Bangla';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${origin}/fonts/anek-bangla-400.woff2') format('woff2');
}
@font-face {
  font-family: 'Anek Bangla';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('${origin}/fonts/anek-bangla-500.woff2') format('woff2');
}
@font-face {
  font-family: 'Anek Bangla';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('${origin}/fonts/anek-bangla-600.woff2') format('woff2');
}

/* Inter - Button Font */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${origin}/fonts/inter-400.woff2') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('${origin}/fonts/inter-500.woff2') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('${origin}/fonts/inter-600.woff2') format('woff2');
}
`;
}

/**
 * Get Google Fonts import URLs for fonts that are NOT locally hosted
 * Local fonts (Hind Siliguri, Anek Bangla, Inter) use @font-face instead
 */
export function getGoogleFontsImports(config: ThemeConfig): string[] {
  const usedFonts = new Set([
    config.headingFont,
    config.bodyFont,
    config.buttonFont,
    config.digitFont,
  ]);

  // Only return Google Fonts URLs for fonts that are NOT locally hosted
  return availableFonts
    .filter(font => usedFonts.has(font.value) && !locallyHostedFonts.includes(font.value))
    .map(font => font.url);
}

/**
 * Generate CSS variables from theme config
 * @param config Theme configuration
 * @param baseUrl Optional base URL for font paths (needed for srcdoc iframes)
 */
export function generateThemeCSS(config: ThemeConfig, baseUrl?: string): string {
  const buttonRadius = config.buttonStyle === 'pill' 
    ? '9999px' 
    : config.buttonStyle === 'square' 
    ? '0' 
    : config.borderRadius;

  const localFontFaces = getLocalFontFacesCSS(baseUrl);

  return `
/* Local Font Faces */
${localFontFaces}

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
  gtmId?: string,
  baseUrl?: string
): string {
  const fontImports = getGoogleFontsImports(themeConfig);
  const themeCSS = generateThemeCSS(themeConfig, baseUrl);

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
  themeConfig: ThemeConfig,
  baseUrl?: string
): string {
  const fontImports = getGoogleFontsImports(themeConfig);
  const themeCSS = generateThemeCSS(themeConfig, baseUrl);
  
  // Use provided baseUrl or get from window
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  const fontLinks = fontImports
    .map(url => `<link href="${url}" rel="stylesheet">`)
    .join('\n  ');

  // Preload local fonts for faster loading in iframe
  const localFontPreloads = `
  <link rel="preload" href="${origin}/fonts/hind-siliguri-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${origin}/fonts/hind-siliguri-600.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${origin}/fonts/anek-bangla-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${origin}/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${origin}/fonts/inter-500.woff2" as="font" type="font/woff2" crossorigin>`;

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Preload local fonts -->
  ${localFontPreloads}
  <!-- Google Fonts -->
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
  inside_city_label?: string;
  inside_city_amount?: number;
  outside_city_label?: string;
  outside_city_amount?: number;
}

/**
 * Generate checkout form preview HTML for admin preview
 * This mirrors the exact structure of CheckoutSection.tsx for consistency
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
  const productImages = product?.images || [];
  
  // Checkout settings with zone support
  const deliveryMode = checkoutSettings?.delivery_mode ?? 'flat';
  const deliveryAmount = checkoutSettings?.delivery_amount ?? 60;
  const insideCityLabel = checkoutSettings?.inside_city_label ?? 'ঢাকার মধ্যে';
  const insideCityAmount = checkoutSettings?.inside_city_amount ?? 60;
  const outsideCityLabel = checkoutSettings?.outside_city_label ?? 'ঢাকার বাহিরে';
  const outsideCityAmount = checkoutSettings?.outside_city_amount ?? 120;
  const currencySymbol = checkoutSettings?.currency === 'USD' ? '$' : checkoutSettings?.currency === 'INR' ? '₹' : '৳';
  
  // Calculate totals (assuming quantity = 1, inside zone for preview)
  const subtotal = productPrice;
  const isFreeDelivery = deliveryMode === 'free';
  const previewDelivery = deliveryMode === 'free' ? 0 : (deliveryMode === 'zoned' ? insideCityAmount : deliveryAmount);
  const total = subtotal + previewDelivery;

  // Get enabled fields
  const fields = config.fields?.filter(f => f.enabled) || defaultCheckoutFields;
  
  // Generate form fields HTML
  const formFieldsHtml = fields.map(field => `
    <div>
      <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 0.375rem; font-family: var(--font-body);">
        ${field.label}${field.required ? '<span style="color: #ef4444;"> *</span>' : ''}
      </label>
      ${field.type === 'textarea' 
        ? `<textarea 
            style="display: block; width: 100%; border-radius: 0.5rem; border: 1px solid #d1d5db; background: #f9fafb; padding: 0.75rem 1rem; font-size: 15px; color: #374151; font-family: var(--font-body); min-height: 4.5rem; resize: vertical;" 
            placeholder="${field.placeholder}" 
            disabled
          ></textarea>`
        : `<input 
            style="display: block; width: 100%; border-radius: 0.5rem; border: 1px solid #d1d5db; background: #f9fafb; padding: 0.75rem 1rem; font-size: 15px; color: #374151; font-family: var(--font-body); height: 2.75rem;" 
            placeholder="${field.placeholder}" 
            type="${field.type || 'text'}"
            disabled 
          />`
      }
    </div>
  `).join('\n');

  const firstImage = productImages[0] || null;
  
  // Zone selection HTML for zoned delivery mode
  const zoneSelectionHtml = deliveryMode === 'zoned' ? `
    <div style="margin-top: 1.5rem;">
      <h4 style="font-weight: 600; margin-bottom: 0.5rem; color: #374151; font-size: 15px; font-family: var(--font-body);">ডেলিভারি এলাকা</h4>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <label style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border: 2px solid ${themeConfig.primaryColor}; border-radius: 0.75rem; background: ${themeConfig.primaryColor}10; cursor: pointer;">
          <input type="radio" name="zone-preview" checked disabled style="width: 1rem; height: 1rem;" />
          <div style="display: flex; justify-content: space-between; width: 100%; font-weight: 500; font-size: 15px; color: #374151;">
            <span style="font-family: var(--font-body);">${insideCityLabel}</span>
            <span style="font-weight: 600; color: #1f2937; font-family: var(--font-digit);">${currencySymbol}${insideCityAmount.toLocaleString()}</span>
          </div>
        </label>
        <label style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; cursor: pointer;">
          <input type="radio" name="zone-preview" disabled style="width: 1rem; height: 1rem;" />
          <div style="display: flex; justify-content: space-between; width: 100%; font-weight: 500; font-size: 15px; color: #374151;">
            <span style="font-family: var(--font-body);">${outsideCityLabel}</span>
            <span style="font-weight: 600; color: #1f2937; font-family: var(--font-digit);">${currencySymbol}${outsideCityAmount.toLocaleString()}</span>
          </div>
        </label>
      </div>
    </div>
  ` : '';

  // Free delivery banner
  const freeDeliveryBanner = isFreeDelivery ? `
    <div style="margin-top: 1.5rem; text-align: center; font-size: 1.125rem; font-weight: 700; color: white; background: linear-gradient(to right, #22c55e, #16a34a); border-radius: 0.75rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <strong>সারা বাংলাদেশে ফ্রি ডেলিভারি! 🎉</strong>
    </div>
  ` : '';

  return `
    <section style="background: var(--theme-bg);" id="checkout">
      <div style="max-width: 72rem; margin: 0 auto; padding: 2rem 1rem;">
        <!-- Header Title -->
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1 style="font-size: 1.5rem; font-weight: 700; color: #1f2937; font-family: var(--font-heading);">
            ${config.title || 'অর্ডার করতে নিচের ফর্মে আপনার নাম, পূর্ণ ঠিকানা এবং মোবাইল নাম্বার লিখুন।'}
          </h1>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Product Selection & Form -->
          <div class="lg:col-span-2" style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- Package Selection Card -->
            <div style="position: relative; padding: 0.75rem; background: white; border: 2px solid ${themeConfig.primaryColor}; border-radius: 0.75rem; display: flex; align-items: center; gap: 0.75rem;">
              <!-- Radio Indicator -->
              <div style="position: absolute; left: 0.5rem; top: 0.5rem; width: 1.25rem; height: 1.25rem; background: white; border: 2px solid ${themeConfig.primaryColor}; border-radius: 9999px; display: flex; align-items: center; justify-content: center; z-index: 10;">
                <div style="width: 0.75rem; height: 0.75rem; border-radius: 9999px; background: ${themeConfig.primaryColor};"></div>
              </div>
              
              <!-- Product Image -->
              <div style="width: 5rem; height: 5rem; border: 2px solid ${themeConfig.primaryColor}; border-radius: 0.75rem; overflow: hidden; background: white; flex-shrink: 0;">
                ${firstImage 
                  ? `<img src="${firstImage}" style="width: 100%; height: 100%; object-fit: cover;" />`
                  : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #9ca3af;">Image</div>`
                }
              </div>
              
              <!-- Content -->
              <div style="flex-grow: 1; min-width: 0;">
                <h3 style="font-weight: 600; color: #374151; font-size: 1rem; line-height: 1.25; font-family: var(--font-body);">
                  ${productName}
                </h3>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem;">
                  <!-- Price Badge -->
                  <span style="background: #ef4444; color: white; font-weight: 700; font-size: 1.25rem; padding: 0.125rem 0.5rem; border-radius: 0.375rem; font-family: var(--font-digit);">
                    ${currencySymbol}${productPrice.toLocaleString()}
                  </span>
                  
                  <!-- Quantity Controls -->
                  <div style="display: flex; align-items: center;">
                    <span style="color: #4b5563; font-weight: 600; margin-right: 0.25rem; font-size: 0.75rem; font-family: var(--font-body);">Qty:</span>
                    <button type="button" style="width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center; border-radius: 9999px; border: 1px solid #e5e7eb; background: white; cursor: pointer;">-</button>
                    <span style="width: 2.5rem; height: 1.75rem; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; color: #374151; font-family: var(--font-digit);">1</span>
                    <button type="button" style="width: 1.5rem; height: 1.5rem; display: flex; align-items: center; justify-content: center; border-radius: 9999px; border: 1px solid #e5e7eb; background: white; cursor: pointer;">+</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Delivery Information Card -->
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem;">
                <div style="width: 0.5rem; height: 1.5rem; background: ${themeConfig.primaryColor}; border-radius: 0.25rem;"></div>
                <h3 style="font-size: 1.5rem; font-weight: 600; color: #1f2937; font-family: var(--font-heading);">ডেলিভারি তথ্য</h3>
              </div>
              <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                ${formFieldsHtml}
              </div>
            </div>
          </div>

          <!-- Right Column (Sticky Summary) -->
          <div>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <div style="width: 0.5rem; height: 1.5rem; background: ${themeConfig.primaryColor}; border-radius: 0.25rem;"></div>
                <h3 style="font-size: 1.5rem; font-weight: 600; color: #1f2937; font-family: var(--font-heading);">Order Summary</h3>
              </div>

              <div style="margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem;">
                <!-- Selected Product -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px dashed #e5e7eb;">
                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 4rem; height: 4rem; border-radius: 0.5rem; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                      ${firstImage 
                        ? `<img src="${firstImage}" style="width: 100%; height: 100%; object-fit: cover;" />`
                        : `<div style="width: 100%; height: 100%; background: #e5e7eb;"></div>`
                      }
                    </div>
                    <div>
                      <span style="font-weight: 600; color: #1f2937; display: block; line-height: 1.25; font-family: var(--font-body);">${productName}</span>
                      <small style="color: #6b7280; font-family: var(--font-body);">× 1</small>
                    </div>
                  </div>
                  <span style="font-weight: 600; color: #1f2937; font-size: 1.125rem; font-family: var(--font-digit);">${currencySymbol}${subtotal.toLocaleString()}</span>
                </div>

                <!-- Subtotal -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; color: #374151;">
                  <span style="font-family: var(--font-body);">Subtotal</span>
                  <span style="font-weight: 500; font-family: var(--font-digit);">${currencySymbol}${subtotal.toLocaleString()}</span>
                </div>

                <!-- Delivery Charge -->
                ${!isFreeDelivery ? `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px dashed #e5e7eb;">
                    <span style="font-family: var(--font-body);">ডেলিভারি চার্জ</span>
                    <span style="font-weight: 500; font-family: var(--font-digit);">${currencySymbol}${previewDelivery.toLocaleString()}</span>
                  </div>
                ` : ''}

                <!-- Total -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; font-size: 1.25rem; font-weight: 700; color: ${themeConfig.primaryColor};">
                  <span style="font-family: var(--font-heading);">সর্বমোট</span>
                  <span style="font-family: var(--font-digit);">${currencySymbol}${total.toLocaleString()}</span>
                </div>
              </div>

              ${zoneSelectionHtml}
              ${freeDeliveryBanner}

              <!-- Submit Button -->
              <div style="margin-top: 1.75rem;">
                <button 
                  type="button" 
                  style="width: 100%; display: flex; justify-content: space-between; align-items: center; background: ${themeConfig.primaryColor}; color: white; font-size: 1.125rem; font-weight: 700; padding: 1rem 1.5rem; border-radius: ${buttonRadius}; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: none; cursor: pointer; font-family: var(--font-button);"
                >
                  <span style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    ${config.ctaText || 'অর্ডার কনফার্ম করুন'}
                  </span>
                  <span style="font-family: var(--font-digit);">${currencySymbol}${total.toLocaleString()}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `.trim();
}
