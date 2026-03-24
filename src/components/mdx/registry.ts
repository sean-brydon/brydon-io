/**
 * MDX Component Registry
 *
 * Central registry of all built-in components available in blog posts.
 * Used by:
 * 1. MDXContent renderer — to know what components are available
 * 2. Post editor — to show "Insert Component" options
 * 3. Future: analytics on component usage, user-submitted components
 */

export interface ComponentMeta {
  /** Display name shown in editor */
  name: string;
  /** Component import name (must match the key in mdxComponents) */
  importName: string;
  /** Short description for the editor tooltip */
  description: string;
  /** Category for grouping in the editor */
  category: "layout" | "visualization" | "code" | "media" | "interactive";
  /** Example usage snippet for the editor */
  snippet: string;
  /** Props the component accepts */
  props?: Record<string, { type: string; required?: boolean; description: string }>;
}

export const COMPONENT_REGISTRY: ComponentMeta[] = [
  // ── Layout ──────────────────────────────────────────────────────────
  {
    name: "Callout",
    importName: "Callout",
    description: "Highlighted callout box for tips, warnings, or notes",
    category: "layout",
    snippet: '<Callout type="info">\n  Your content here\n</Callout>',
    props: {
      type: { type: '"info" | "warning" | "error" | "tip"', required: false, description: "Callout style variant" },
      title: { type: "string", required: false, description: "Optional title" },
    },
  },
  {
    name: "Link Preview",
    importName: "LinkPreview",
    description: "Rich link preview card with OG data",
    category: "layout",
    snippet: '<LinkPreview url="https://example.com" />',
    props: {
      url: { type: "string", required: true, description: "URL to preview" },
    },
  },

  // ── Code ────────────────────────────────────────────────────────────
  {
    name: "Code Block",
    importName: "CodeBlock",
    description: "Syntax-highlighted code block with copy button",
    category: "code",
    snippet: '```typescript\nconst hello = "world";\n```',
  },

  // ── Interactive / Visualization ─────────────────────────────────────
  {
    name: "Canvas",
    importName: "Canvas",
    description: "HTML5 Canvas component for custom drawings",
    category: "interactive",
    snippet: "<Canvas />",
  },
  {
    name: "Permission Graph",
    importName: "PermissionGraphViz",
    description: "Interactive permission system visualization",
    category: "visualization",
    snippet: "<PermissionGraphViz />",
  },
  {
    name: "Dunning Kruger Viz",
    importName: "DunningViz",
    description: "Interactive Dunning-Kruger effect visualization",
    category: "visualization",
    snippet: "<DunningViz />",
  },
  {
    name: "High Water Mark Viz",
    importName: "HWMViz",
    description: "High water mark pattern visualization",
    category: "visualization",
    snippet: "<HWMViz />",
  },
  {
    name: "SVG Particle Morph",
    importName: "SVGParticleMorphViz",
    description: "SVG-to-particle morphing animation",
    category: "visualization",
    snippet: "<SVGParticleMorphViz />",
  },
  {
    name: "Particle Morph Playground",
    importName: "ParticleMorphPlayground",
    description: "Interactive playground for particle morphing",
    category: "interactive",
    snippet: "<ParticleMorphPlayground />",
  },
];

/** Quick lookup by importName */
export const COMPONENT_MAP = Object.fromEntries(
  COMPONENT_REGISTRY.map((c) => [c.importName, c])
);

/** Get components grouped by category */
export function getComponentsByCategory() {
  const grouped: Record<string, ComponentMeta[]> = {};
  for (const component of COMPONENT_REGISTRY) {
    if (!grouped[component.category]) grouped[component.category] = [];
    grouped[component.category].push(component);
  }
  return grouped;
}
