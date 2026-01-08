/**
 * Function Detail Handler - Handles function detail page requests
 */

import { Layout } from '../components/Layout.js';
import { FunctionDetail } from '../components/FunctionDetail.js';
import { getFunctionById } from '../services/search.js';

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
 * Handle function detail page request (GET /function/:id)
 */
export function handleFunctionDetail(request: Request): Response {
  const url = new URL(request.url);
  const path = url.pathname;

  // Extract function ID from path: /function/{id}
  const id = decodeURIComponent(path.replace('/function/', ''));

  if (!id) {
    return new Response('Function ID required', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const func = getFunctionById(id);

  if (!func) {
    // Build 404 content using template string (no JSX)
    const notFoundContent = `
      <div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p class="text-gray-500 mb-4">Function "${escapeHtml(id)}" not found</p>
        <a href="/" class="text-purple-600 hover:underline">
          &larr; Back to search
        </a>
      </div>
    `;

    const html = Layout({
      title: 'Function Not Found - Hoogle-Effect',
      children: notFoundContent,
    });

    return new Response(html, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const title = `${func.module}.${func.name} - Hoogle-Effect`;
  const html = Layout({ title, children: FunctionDetail({ func }) });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
