/**
 * Hoogle-Effect Cloudflare Worker Entry Point
 * Pure server-side rendered search engine for Effect-TS
 */

import { handleSearch, handleSearchFragment } from './handlers/search.js';
import { handleFunctionDetail } from './handlers/function-detail.js';
import { handleApiSearch } from './handlers/api.js';

export interface Env {
  // Future: Durable Objects
  // SEARCH_INDEX: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // API endpoints (JSON responses)
      if (path === '/api/search') {
        return handleApiSearch(request);
      }

      // HTML routes
      if (path === '/') {
        // Check if this is an HTML fragment request (for progressive enhancement)
        const wantsFragment =
          request.headers.get('HX-Request') === 'true' ||
          request.headers.get('Accept')?.includes('text/html-partial');

        if (wantsFragment) {
          return handleSearchFragment(request);
        }
        return handleSearch(request);
      }

      // Function detail page: /function/{id}
      if (path.startsWith('/function/')) {
        return handleFunctionDetail(request);
      }

      // 404 for unknown routes
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  },
};

// Future: Export Durable Object class
// export { SearchIndexDO } from './durable-objects/search-index.js';
