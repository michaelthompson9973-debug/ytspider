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
  const previewDelivery = deliveryMode === 'zoned' ? insideCityAmount : deliveryAmount;
  const total = subtotal + previewDelivery;

  // Get enabled fields
  const fields = config.fields?.filter(f => f.enabled) || defaultCheckoutFields;
  
  // Generate form fields HTML with proper labels (matching CheckoutSection.tsx)
  const formFieldsHtml = fields.map(field => `
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <label style="font-family: var(--font-body); font-size: 0.875rem; font-weight: 500; display: block;">
        ${field.label}${field.required ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ''}
      </label>
      ${field.type === 'textarea' 
        ? `<textarea 
            style="width: 100%; border-radius: ${themeConfig.borderRadius}; border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; font-family: var(--font-body); background: white; font-size: 1rem; resize: vertical; min-height: 4.5rem;" 
            placeholder="${field.placeholder}" 
            disabled
          ></textarea>`
        : `<input 
            style="width: 100%; border-radius: ${themeConfig.borderRadius}; border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; font-family: var(--font-body); background: white; font-size: 1rem; height: 2.5rem;" 
            placeholder="${field.placeholder}" 
            type="${field.type || 'text'}"
            disabled 
          />`
      }
    </div>
  `).join('\n');

  // Generate image gallery HTML (matching ProductImageGallery.tsx)
  const hasMultipleImages = productImages.length > 1;
  const firstImage = productImages[0] || null;
  
  const imageGalleryHtml = firstImage 
    ? `
      <div style="width: 100%; display: flex; flex-direction: column; gap: 0.75rem;">
        <!-- Main Image with aspect-square -->
        <div style="position: relative; width: 100%; padding-bottom: 100%; border-radius: ${themeConfig.borderRadius}; overflow: hidden; background: #f3f4f6;">
          <img 
            src="${firstImage}" 
            alt="${productName}" 
            style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;" 
          />
          ${hasMultipleImages ? `
            <!-- Navigation arrows -->
            <button 
              type="button" 
              style="position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); width: 2rem; height: 2rem; border-radius: 9999px; background: rgba(255,255,255,0.8); backdrop-filter: blur(4px); border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; cursor: pointer;"
              disabled
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              type="button" 
              style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); width: 2rem; height: 2rem; border-radius: 9999px; background: rgba(255,255,255,0.8); backdrop-filter: blur(4px); border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; cursor: pointer;"
              disabled
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <!-- Image counter -->
            <div style="position: absolute; bottom: 0.5rem; right: 0.5rem; padding: 0.25rem 0.5rem; border-radius: 9999px; background: rgba(255,255,255,0.8); backdrop-filter: blur(4px); font-size: 0.75rem; font-family: var(--font-digit);">
              1 / ${productImages.length}
            </div>
          ` : ''}
        </div>
        ${hasMultipleImages ? `
          <!-- Thumbnail Navigation -->
          <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.25rem;">
            ${productImages.map((img, idx) => `
              <button 
                type="button" 
                style="flex-shrink: 0; width: 4rem; height: 4rem; border-radius: ${themeConfig.borderRadius}; overflow: hidden; border: 2px solid ${idx === 0 ? themeConfig.primaryColor : 'transparent'}; cursor: pointer;"
                disabled
              >
                <img src="${img}" alt="Thumbnail ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;" />
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `
    : `<div style="width: 100%; padding-bottom: 100%; position: relative; background: #e5e7eb; border-radius: ${themeConfig.borderRadius}; overflow: hidden;">
        <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-family: var(--font-body);">
          Product Image
        </div>
      </div>`;

  // Zone selection HTML for zoned delivery mode
  const zoneSelectionHtml = deliveryMode === 'zoned' ? `
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <span style="font-family: var(--font-body); font-size: 0.875rem; color: #6b7280;">ডেলিভারি এলাকা:</span>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-radius: ${themeConfig.borderRadius}; border: 2px solid ${themeConfig.primaryColor}; background: ${themeConfig.primaryColor}10; cursor: pointer;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <input type="radio" name="zone-preview" checked disabled style="width: 1rem; height: 1rem;" />
            <span style="font-family: var(--font-body);">${insideCityLabel}</span>
          </div>
          <span style="font-family: var(--font-digit); color: ${themeConfig.primaryColor}; font-weight: 500;">${currencySymbol}${insideCityAmount.toLocaleString()}</span>
        </label>
        <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-radius: ${themeConfig.borderRadius}; border: 1px solid #e5e7eb; cursor: pointer;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <input type="radio" name="zone-preview" disabled style="width: 1rem; height: 1rem;" />
            <span style="font-family: var(--font-body);">${outsideCityLabel}</span>
          </div>
          <span style="font-family: var(--font-digit); color: ${themeConfig.primaryColor}; font-weight: 500;">${currencySymbol}${outsideCityAmount.toLocaleString()}</span>
        </label>
      </div>
    </div>
  ` : '';

  return `
    <section class="py-12 px-4" style="background-color: hsl(var(--muted) / 0.5);" id="checkout">
      <div class="container" style="max-width: 56rem; margin: 0 auto;">
        <div style="border-radius: ${themeConfig.borderRadius}; background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 1.5rem;">
          <h2 style="font-family: var(--font-heading); color: ${themeConfig.primaryColor}; font-size: 1.5rem; font-weight: 600; text-align: center; margin-bottom: 1.5rem;">
            ${config.title || 'অর্ডার করুন'}
          </h2>
          
          <!-- 2-Column Grid Layout -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <!-- Left Column: Product Info -->
            <div style="padding: 1rem; border-radius: ${themeConfig.borderRadius}; background: hsl(var(--muted) / 0.5); border: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 1rem;">
              <!-- Image Gallery -->
              ${imageGalleryHtml}
              
              <!-- Product name + price -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <p style="font-family: var(--font-body); font-size: 1.125rem; font-weight: 500; margin: 0;">${productName}</p>
                <p style="font-family: var(--font-digit); font-size: 1.125rem; color: ${themeConfig.primaryColor}; font-weight: 700; margin: 0;">${currencySymbol}${productPrice.toLocaleString()}</p>
              </div>
              
              <!-- Quantity selector -->
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-family: var(--font-body); font-size: 0.875rem; color: #6b7280;">পরিমাণ:</span>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <button type="button" style="width: 2rem; height: 2rem; border-radius: ${themeConfig.borderRadius}; border: 1px solid #e5e7eb; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
                  </button>
                  <span style="font-family: var(--font-digit); font-size: 1.125rem; width: 2rem; text-align: center;">1</span>
                  <button type="button" style="width: 2rem; height: 2rem; border-radius: ${themeConfig.borderRadius}; border: 1px solid #e5e7eb; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  </button>
                </div>
              </div>
              
              <!-- Zone Selection (for zoned mode) -->
              ${zoneSelectionHtml}
              
              <!-- Price breakdown -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
                <div style="display: flex; justify-content: space-between; font-family: var(--font-body);">
                  <span style="color: #6b7280;">সাবটোটাল:</span>
                  <span style="font-family: var(--font-digit);">${currencySymbol}${subtotal.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-family: var(--font-body);">
                  <span style="color: #6b7280;">ডেলিভারি চার্জ:</span>
                  <span style="font-family: var(--font-digit);">${currencySymbol}${previewDelivery.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-family: var(--font-body); font-weight: 600; font-size: 1rem; border-top: 1px solid #e5e7eb; padding-top: 0.5rem;">
                  <span>সর্বমোট:</span>
                  <span style="font-family: var(--font-digit); color: ${themeConfig.primaryColor};">${currencySymbol}${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <!-- Right Column: Form fields -->
            <form style="display: flex; flex-direction: column; gap: 1rem;">
              ${formFieldsHtml}
              
              <button 
                type="button" 
                style="width: 100%; background: ${themeConfig.primaryColor}; color: white; padding: 0.75rem; border-radius: ${buttonRadius}; font-family: var(--font-button); font-size: 1.125rem; font-weight: 600; border: none; cursor: pointer;"
              >
                ${config.ctaText || 'অর্ডার সম্পন্ন করুন'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `.trim();
}
