/**
 * CodeBlock Component - Displays code with copy button
 * Copy functionality handled by progressive enhancement script
 */

interface CodeBlockProps {
  code: string;
  language?: string;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function CodeBlock({ code }: CodeBlockProps): string {
  const escapedCode = escapeHtml(code);
  // Escape the code for use in data-copy attribute
  const dataCode = escapeHtml(code);

  return `
    <div class="relative group">
      <pre class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
        <code class="text-sm text-gray-100 font-mono whitespace-pre">${escapedCode}</code>
      </pre>
      <button
        type="button"
        data-copy="${dataCode}"
        class="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600 copy-btn"
      >
        Copy
      </button>
    </div>
  `;
}
