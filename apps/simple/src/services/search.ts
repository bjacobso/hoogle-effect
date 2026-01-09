/**
 * Search Service
 * Provides fuzzy search over the Effect-TS function index using Fuse.js
 */

import Fuse from 'fuse.js';
import type { FunctionEntry, SearchIndex } from '@hoogle-effect/api';

// Import the index at build time (bundled with worker)
// @ts-expect-error - JSON import resolved at bundle time
import indexData from '@hoogle-effect/data/index.json';

// Cached Fuse instance
let fuseInstance: Fuse<FunctionEntry> | null = null;

/**
 * Get the search index (loaded at build time)
 */
export function getIndex(): SearchIndex {
  return indexData as SearchIndex;
}

/**
 * Get or create the Fuse.js search instance
 */
function getFuse(): Fuse<FunctionEntry> {
  if (fuseInstance) return fuseInstance;

  const index = getIndex();

  // Configure Fuse with weighted keys matching the React app
  fuseInstance = new Fuse(index.functions, {
    keys: [
      { name: 'name', weight: 2 },
      { name: 'id', weight: 1.5 },
      { name: 'module', weight: 1 },
      { name: 'description', weight: 0.8 },
      { name: 'signature', weight: 0.5 },
      { name: 'tags', weight: 0.7 },
    ],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  return fuseInstance;
}

/**
 * Search the index for functions matching the query
 */
export function searchFunctions(
  query: string,
  options: { limit?: number } = {}
): FunctionEntry[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const fuse = getFuse();
  const results = fuse.search(trimmed, { limit: options.limit || 50 });

  return results.map((result) => result.item);
}

/**
 * Get a function by its ID (e.g., "Effect.map")
 */
export function getFunctionById(id: string): FunctionEntry | undefined {
  const index = getIndex();
  return index.functions.find((fn) => fn.id === id);
}

/**
 * Get index statistics
 */
export function getIndexStats() {
  const index = getIndex();
  return {
    totalFunctions: index.functions.length,
    totalModules: index.modules.length,
    effectVersion: index.effectVersion,
    buildDate: index.buildDate,
  };
}
