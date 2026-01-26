import { ThemeConfig, availableFonts, defaultThemeConfig } from './types';

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
