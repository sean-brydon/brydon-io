/**
 * Detect whether post content is HTML (from Novel editor) or MDX (legacy).
 *
 * Heuristics:
 * 1. If the content starts with an HTML block-level tag (<p>, <h1>–<h6>,
 *    <ul>, <ol>, <blockquote>, <div>, <pre>, <table>, <hr>), it's HTML.
 * 2. If the content contains JSX-style component tags like <Callout>,
 *    <Canvas>, <CodeBlock>, etc., it's MDX.
 * 3. If the content contains MDX-specific syntax like import/export
 *    statements, it's MDX.
 * 4. Default to MDX for backward compatibility (existing posts are MDX).
 */
export function isHtmlContent(content: string): boolean {
  if (!content || content.trim().length === 0) return false;

  const trimmed = content.trim();

  // MDX indicators: import/export statements, or JSX component tags (PascalCase)
  if (/^(import|export)\s/m.test(trimmed)) return false;
  if (/<[A-Z][a-zA-Z]*[\s/>]/.test(trimmed)) return false;

  // HTML indicator: starts with a standard HTML block tag
  const startsWithHtmlTag = /^<(p|h[1-6]|ul|ol|li|blockquote|div|pre|table|hr|br|img|a|strong|em)[\s>\/]/i.test(trimmed);
  if (startsWithHtmlTag) return true;

  // HTML indicator: heavily tag-based content (high tag-to-text ratio)
  const tagCount = (trimmed.match(/<\/?[a-z][a-z0-9]*[\s>\/]/gi) || []).length;
  const lineCount = trimmed.split("\n").length;
  // If most lines have HTML tags, treat as HTML
  if (tagCount > 0 && tagCount >= lineCount * 0.5) return true;

  // Default: treat as MDX for backward compat
  return false;
}
