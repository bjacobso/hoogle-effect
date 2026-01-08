/**
 * ResultsList Component - Displays search results
 * Uses template strings for server-side rendering
 */

import type { FunctionEntry } from '@hoogle-effect/api';
import { SignatureDisplay } from './SignatureDisplay.js';

interface ResultsListProps {
  results: FunctionEntry[];
  query: string;
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

function EmptyState(): string {
  const suggestions = ['map', 'flatMap', 'retry', 'Effect', 'forEach'];
  const suggestionLinks = suggestions
    .map(
      (term) =>
        `<a href="/?q=${encodeURIComponent(term)}" class="px-2 py-1 bg-gray-100 rounded text-gray-600 hover:bg-purple-100 hover:text-purple-700 transition-colors no-underline">${escapeHtml(term)}</a>`
    )
    .join('\n');

  return `
    <div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <p class="text-gray-500 mb-4">Start typing to search Effect functions</p>
      <div class="text-sm text-gray-400 space-y-2">
        <p>Try searching for:</p>
        <div class="flex flex-wrap gap-2 justify-center">
          ${suggestionLinks}
        </div>
      </div>
    </div>
  `;
}

function NoResults(query: string): string {
  return `
    <div class="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
      <p>No results found for "${escapeHtml(query)}"</p>
      <p class="text-sm mt-2">Try a different search term</p>
    </div>
  `;
}

function ResultItem(func: FunctionEntry): string {
  const sinceTag = func.since
    ? `<span class="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">v${escapeHtml(func.since)}</span>`
    : '';

  const githubIcon = func.githubUrl
    ? `<span class="text-gray-400 hover:text-purple-600 transition-colors" title="View on GitHub">${GitHubIcon()}</span>`
    : '';

  const description = func.description
    ? `<p class="text-sm text-gray-500 line-clamp-2">${escapeHtml(func.description)}</p>`
    : '';

  const tags =
    func.tags.length > 0
      ? `<div class="flex flex-wrap gap-1">
          ${func.tags
            .slice(0, 2)
            .map((tag) => `<span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">${escapeHtml(tag)}</span>`)
            .join('\n')}
        </div>`
      : '';

  return `
    <a
      href="/function/${encodeURIComponent(func.id)}"
      class="block w-full text-left p-4 rounded-lg border bg-white border-gray-200 hover:border-purple-200 hover:bg-purple-50/50 transition-all no-underline"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-gray-900">${escapeHtml(func.module)}</span>
            <span class="text-gray-400">.</span>
            <span class="font-semibold text-purple-600">${escapeHtml(func.name)}</span>
            ${sinceTag}
            ${githubIcon}
          </div>

          <div class="text-sm text-gray-600 font-mono truncate mb-2">
            ${SignatureDisplay({ signature: func.signature, compact: true })}
          </div>

          ${description}
        </div>

        ${tags}
      </div>
    </a>
  `;
}

export function ResultsList({ results, query }: ResultsListProps): string {
  if (!query) {
    return EmptyState();
  }

  if (results.length === 0) {
    return NoResults(query);
  }

  const resultItems = results.map((func) => ResultItem(func)).join('\n');

  return `
    <div class="space-y-2" id="results">
      <div class="text-sm text-gray-500 mb-3">
        ${results.length} result${results.length !== 1 ? 's' : ''}
      </div>
      ${resultItems}
    </div>
  `;
}
