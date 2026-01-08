/**
 * Search Handler - Handles search requests
 * Returns full HTML page or HTML fragment for progressive enhancement
 */

import { Layout } from '../components/Layout.js';
import { SearchBar } from '../components/SearchBar.js';
import { ResultsList } from '../components/ResultsList.js';
import { searchFunctions, getIndexStats } from '../services/search.js';

/**
 * Handle full page search request (GET /)
 */
export function handleSearch(request: Request): Response {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';

  const results = query ? searchFunctions(query, { limit: 50 }) : [];
  const stats = getIndexStats();

  // Build content using function calls (no JSX in handlers)
  const content = `
    <div>
      <div class="mb-6">
        ${SearchBar({ value: query })}
        <div class="mt-3 text-sm text-gray-500">
          ${stats.totalFunctions} functions indexed from Effect ${stats.effectVersion}
        </div>
      </div>
      ${ResultsList({ results, query })}
    </div>
  `;

  const title = query ? `"${query}" - Hoogle-Effect` : 'Hoogle-Effect';
  const html = Layout({ title, children: content });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

/**
 * Handle HTML fragment request for progressive enhancement
 * Returns just the results HTML without the full page wrapper
 */
export function handleSearchFragment(request: Request): Response {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';

  const results = query ? searchFunctions(query, { limit: 50 }) : [];

  const html = ResultsList({ results, query });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
