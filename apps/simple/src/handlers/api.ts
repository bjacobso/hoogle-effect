/**
 * API Handler - JSON API endpoints
 */

import { searchFunctions, getIndexStats, getFunctionById } from '../services/search.js';

/**
 * Handle API search request (GET /api/search?q=...)
 * Returns JSON array of matching functions
 */
export function handleApiSearch(request: Request): Response {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  if (!query) {
    // Return index stats if no query
    const stats = getIndexStats();
    return new Response(JSON.stringify(stats), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  const results = searchFunctions(query, { limit });

  return new Response(JSON.stringify({ query, results }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

/**
 * Handle API function detail request (GET /api/function/:id)
 * Returns JSON for a single function
 */
export function handleApiFunctionDetail(request: Request): Response {
  const url = new URL(request.url);
  const path = url.pathname;

  // Extract function ID from path: /api/function/{id}
  const id = decodeURIComponent(path.replace('/api/function/', ''));

  if (!id) {
    return new Response(JSON.stringify({ error: 'Function ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const func = getFunctionById(id);

  if (!func) {
    return new Response(JSON.stringify({ error: 'Function not found', id }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(func), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
