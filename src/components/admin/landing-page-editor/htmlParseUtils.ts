/**
 * Utility functions for parsing and merging HTML parts (styles/scripts vs body content)
 */

export interface HtmlParts {
  head: string;
  body: string;
}

/**
 * Parse full HTML into head (styles/scripts) and body (remaining content) parts
 */
export function parseHtmlParts(fullHtml: string): HtmlParts {
  const styleRegex = /<style[^>]*>[\s\S]*?<\/style>/gi;
  const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi;
  
  const styleMatches = fullHtml.match(styleRegex) || [];
  const scriptMatches = fullHtml.match(scriptRegex) || [];
  
  let bodyHtml = fullHtml;
  [...styleMatches, ...scriptMatches].forEach(match => {
    bodyHtml = bodyHtml.replace(match, '');
  });
  
  // Keep only <body>...</body> if present, otherwise return remaining content
  const bodyTagRegex = /<body[^>]*>[\s\S]*?<\/body>/i;
  const bodyMatch = bodyHtml.match(bodyTagRegex);
  const bodyContent = bodyMatch ? bodyMatch[0].trim() : bodyHtml.trim();
  
  return {
    head: [...styleMatches, ...scriptMatches].join('\n\n'),
    body: bodyContent
  };
}

/**
 * Merge head and body parts back into full HTML
 */
export function mergeHtmlParts(head: string, body: string): string {
  const trimmedHead = head.trim();
  const trimmedBody = body.trim();
  
  if (!trimmedHead) return trimmedBody;
  if (!trimmedBody) return trimmedHead;
  return `${trimmedHead}\n\n${trimmedBody}`;
}
