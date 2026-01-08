/**
 * SignatureDisplay Component - Syntax highlighted type signatures
 * Uses template strings for server-side rendering
 */

interface SignatureDisplayProps {
  signature: string;
  compact?: boolean;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Simple syntax highlighting for type signatures
 * Returns HTML string with span elements for coloring
 */
function highlightSignature(sig: string): string {
  const parts: string[] = [];
  let remaining = sig;

  // Escape HTML in the signature first
  remaining = remaining
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Patterns to highlight (order matters - more specific first)
  const patterns: [RegExp, string][] = [
    // Effect types (blue)
    [/^(Effect|Stream|Option|Either|Cause|Exit|Layer|Schedule|Fiber|Ref|Queue|Chunk|Array|HashMap|HashSet|Context)(?=&lt;|[^a-zA-Z]|$)/g, 'text-blue-400 font-medium'],
    // Primitive types (green)
    [/^(string|number|boolean|void|never|unknown|any|null|undefined)/g, 'text-green-400'],
    // Arrows (purple)
    [/^(=&gt;)/g, 'text-purple-400'],
    // Operators and brackets (gray)
    [/^(&lt;|&gt;|\||&amp;)/g, 'text-gray-400'],
    [/^(\{|\}|\(|\)|\[|\]|,|;|:)/g, 'text-gray-400'],
    // Type parameters like A, E, R (amber) - single capital letters or common type params
    [/^([A-Z][a-zA-Z0-9]*)/g, 'text-amber-400'],
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const [pattern, className] of patterns) {
      pattern.lastIndex = 0;
      const match = remaining.match(pattern);
      if (match && match.index === 0) {
        parts.push(`<span class="${className}">${match[0]}</span>`);
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Handle whitespace and other characters
      const char = remaining[0];
      if (char === ' ' || char === '\n') {
        parts.push(char);
      } else {
        // Find the next special character or end
        const nextSpecial = remaining.slice(1).search(/[&<>(){}[\],;:|=\s]/);
        const end = nextSpecial === -1 ? remaining.length : nextSpecial + 1;
        parts.push(`<span class="text-gray-300">${remaining.slice(0, end)}</span>`);
        remaining = remaining.slice(end);
        continue;
      }
      remaining = remaining.slice(1);
    }
  }

  return parts.join('');
}

/**
 * Simplify complex signatures for compact display
 */
function simplifySignature(sig: string): string {
  // If it's an overloaded function, just show first overload
  if (sig.startsWith('{ ')) {
    const firstOverload = sig.match(/\{ ([^;]+);/);
    if (firstOverload) {
      return firstOverload[1].trim() + ' (+ overloads)';
    }
  }

  // Truncate very long signatures
  if (sig.length > 120) {
    return sig.slice(0, 117) + '...';
  }

  return sig;
}

export function SignatureDisplay({ signature, compact }: SignatureDisplayProps): string {
  const displaySig = compact ? simplifySignature(signature) : signature;

  if (compact) {
    return `<span class="text-gray-600">${escapeHtml(displaySig)}</span>`;
  }

  // Use highlighted HTML for full display
  const highlighted = highlightSignature(displaySig);

  return `<code class="text-sm text-gray-100 font-mono whitespace-pre-wrap break-all">${highlighted}</code>`;
}
