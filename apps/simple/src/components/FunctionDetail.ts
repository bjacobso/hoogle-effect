/**
 * FunctionDetail Component - Full function documentation view
 * Uses template strings for server-side rendering
 */

import type { FunctionEntry } from '@hoogle-effect/api';
import { SignatureDisplay } from './SignatureDisplay.js';
import { CodeBlock } from './CodeBlock.js';

interface FunctionDetailProps {
  func: FunctionEntry;
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

// GitHub icon SVG
const GitHubIcon = (): string => `
  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
`;

export function FunctionDetail({ func }: FunctionDetailProps): string {
  const importStatement = `import { ${func.module} } from "${func.package}"`;

  // Build tags HTML
  const tagsHtml = func.tags
    .map((tag) => `<span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">${escapeHtml(tag)}</span>`)
    .join('\n');

  const sinceTag = func.since
    ? `<span class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">since v${escapeHtml(func.since)}</span>`
    : '';

  const deprecatedTag = func.deprecated
    ? `<span class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">deprecated</span>`
    : '';

  // Build examples HTML
  const examplesHtml =
    func.examples.length > 0
      ? `
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Examples
          </h3>
          <div class="space-y-4">
            ${func.examples
              .map(
                (example) => `
                <div>
                  ${example.title ? `<p class="text-sm font-medium text-gray-700 mb-2">${escapeHtml(example.title)}</p>` : ''}
                  ${CodeBlock({ code: example.code })}
                </div>
              `
              )
              .join('\n')}
          </div>
        </div>
      `
      : '';

  // Build source link HTML
  const sourceHtml = func.githubUrl
    ? `
      <div class="p-6 bg-gray-50">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Source
        </h3>
        <a
          href="${escapeHtml(func.githubUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
        >
          ${GitHubIcon()}
          View on GitHub
        </a>
      </div>
    `
    : '';

  return `
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <!-- Header -->
      <div class="p-6 border-b border-gray-100 bg-gray-50">
        <div class="flex items-center gap-2 mb-2">
          <a href="/" class="text-gray-400 hover:text-purple-600 transition-colors">
            &larr; Back
          </a>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg text-gray-600">${escapeHtml(func.module)}</span>
          <span class="text-gray-400">.</span>
          <span class="text-xl font-bold text-purple-600">${escapeHtml(func.name)}</span>
        </div>

        <div class="flex flex-wrap gap-2 mb-4">
          ${tagsHtml}
          ${sinceTag}
          ${deprecatedTag}
        </div>

        <!-- Type signature -->
        <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          ${SignatureDisplay({ signature: func.signature })}
        </div>
      </div>

      <!-- Description -->
      <div class="p-6 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Description
        </h3>
        <p class="text-gray-700 leading-relaxed">
          ${escapeHtml(func.description || 'No description available.')}
        </p>
      </div>

      ${examplesHtml}

      <!-- Import -->
      <div class="p-6 bg-gray-50 border-b border-gray-100">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Import
        </h3>
        <div class="flex items-center gap-2">
          <code class="flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono text-gray-700">
            ${escapeHtml(importStatement)}
          </code>
          <button
            type="button"
            data-copy="${escapeHtml(importStatement)}"
            class="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors copy-btn"
          >
            Copy
          </button>
        </div>
      </div>

      ${sourceHtml}
    </div>
  `;
}
