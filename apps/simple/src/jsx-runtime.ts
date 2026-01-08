/**
 * Custom JSX Runtime for Server-Side Rendering
 * Renders JSX directly to HTML strings without React or virtual DOM.
 * ~100 lines, no dependencies.
 */

// Void elements that don't have closing tags
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// HTML attribute name mappings
const ATTR_ALIASES: Record<string, string> = {
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv',
};

// Child types that can be rendered
type Child = string | number | boolean | null | undefined | Child[];

// Props type for JSX elements
type Props = Record<string, unknown> & { children?: Child | Child[] };

// Component function type
type Component = (props: Props) => string;

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render children to an HTML string
 */
function renderChildren(children: Child | Child[]): string {
  if (children == null || children === false || children === true) {
    return '';
  }

  if (Array.isArray(children)) {
    return children.map(renderChildren).join('');
  }

  if (typeof children === 'string') {
    return escapeHtml(children);
  }

  if (typeof children === 'number') {
    return String(children);
  }

  return '';
}

/**
 * Build HTML attributes string from props
 */
function buildAttributes(props: Props | null): string {
  if (!props) return '';

  const attrs: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    // Skip children and undefined/null values
    if (key === 'children' || value == null || value === false) {
      continue;
    }

    // Handle boolean attributes
    if (value === true) {
      attrs.push(key);
      continue;
    }

    // Handle dangerouslySetInnerHTML (skip, handled separately)
    if (key === 'dangerouslySetInnerHTML') {
      continue;
    }

    // Map attribute names (className -> class, etc.)
    const attrName = ATTR_ALIASES[key] || key;

    // Convert camelCase event handlers and data attributes
    const finalName = attrName.startsWith('on')
      ? attrName.toLowerCase()
      : attrName;

    attrs.push(`${finalName}="${escapeHtml(String(value))}"`);
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

/**
 * Main JSX factory function
 * Called by TypeScript's JSX transform for each element
 */
export function jsx(
  tag: string | Component,
  props: Props | null
): string {
  // Handle function components
  if (typeof tag === 'function') {
    return tag(props || {});
  }

  const attributes = buildAttributes(props);
  const children = props?.children;

  // Handle dangerouslySetInnerHTML
  if (props?.dangerouslySetInnerHTML) {
    const html = (props.dangerouslySetInnerHTML as { __html: string }).__html;
    return `<${tag}${attributes}>${html}</${tag}>`;
  }

  // Void elements (self-closing)
  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${attributes} />`;
  }

  // Regular elements with children
  const childrenHtml = renderChildren(children);
  return `<${tag}${attributes}>${childrenHtml}</${tag}>`;
}

// jsxs is identical to jsx for server rendering (no key handling needed)
export const jsxs = jsx;

/**
 * Fragment - renders children without a wrapper element
 */
export function Fragment(props: { children?: Child | Child[] }): string {
  return renderChildren(props.children);
}

/**
 * Helper to mark a string as raw HTML (won't be escaped)
 * Use with caution - only for trusted content
 */
export function raw(html: string): string {
  return html;
}

// JSX namespace for TypeScript
export namespace JSX {
  export interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
  export type Element = string;
}
