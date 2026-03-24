"use client";

import DOMPurify from "isomorphic-dompurify";

/**
 * Renders sanitized HTML content from the tiptap rich-text editor.
 *
 * All content is run through DOMPurify before rendering to prevent XSS.
 * Styled to match the MDXContent component's prose styling.
 * Supports tiptap-specific elements: task lists, highlights, text alignment,
 * subscript/superscript, and underline.
 */
export function HTMLContent({ source }: { source: string }) {
  const clean = DOMPurify.sanitize(source, {
    // Allow standard HTML tags that tiptap can produce
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "del",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "hr",
      "a", "img",
      "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span",
      "sub", "sup", "mark",
      // Tiptap task list elements
      "input", "label",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel",
      "src", "alt", "title", "width", "height",
      "class", "id",
      "colspan", "rowspan",
      // Tiptap data attributes for task lists, highlights, etc.
      "data-type", "data-checked", "data-color",
      // Tiptap text alignment uses inline styles
      "style",
      // Task list checkbox
      "type", "checked", "disabled",
    ],
    // Force all links to open in new tab safely
    ADD_ATTR: ["target"],
    // Only allow safe inline styles (text-align for tiptap alignment)
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });

  // Only allow safe inline style properties (defense in depth)
  const styleSafe = clean.replace(
    /style="([^"]*)"/g,
    (_match, styleValue: string) => {
      const allowed: string[] = [];

      // text-align for tiptap alignment
      const alignMatch = styleValue.match(/text-align:\s*(left|center|right|justify)/);
      if (alignMatch) allowed.push(`text-align: ${alignMatch[1]}`);

      // background-color for tiptap highlights (CSS variables or hex/rgb values)
      const bgMatch = styleValue.match(/background-color:\s*(var\(--[\w-]+\)|#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
      if (bgMatch) allowed.push(`background-color: ${bgMatch[1]}`);

      return allowed.length > 0 ? `style="${allowed.join("; ")}"` : "";
    },
  );

  // After sanitization, enforce rel="noopener noreferrer" on links
  const safeHtml = styleSafe.replace(
    /<a /g,
    '<a target="_blank" rel="noopener noreferrer" ',
  );

  return (
    <div
      className="html-content"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
