import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { FunctionEntry, ModuleEntry } from '@hoogle-effect/api'
import { searchByType } from '@hoogle-effect/api'
import { useIndex } from './useIndex'

export type SearchMode = 'text' | 'type'

export interface SearchFilters {
  packages?: Set<string>
}

interface UseSearchResult {
  results: FunctionEntry[]
  allFunctions: FunctionEntry[]
  modules: ModuleEntry[]
  isLoading: boolean
  error: string | null
  indexStats: ReturnType<typeof useIndex>['indexStats']
  availablePackages: string[]
}

// Global Fuse cache
let fuseCache: Fuse<FunctionEntry> | null = null

function createFuse(functions: FunctionEntry[]): Fuse<FunctionEntry> {
  if (fuseCache) return fuseCache

  fuseCache = new Fuse(functions, {
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
  })

  return fuseCache
}

export function useSearch(
  query: string,
  filters?: SearchFilters,
  mode: SearchMode = 'text'
): UseSearchResult {
  const { index, isLoading, error, indexStats, availablePackages } = useIndex()

  // Compute search results based on mode
  const results = useMemo(() => {
    if (!index || !query.trim()) {
      return []
    }

    let items: FunctionEntry[]

    if (mode === 'type') {
      // Type-based search
      const typeResults = searchByType(query.trim(), index.functions)
      items = typeResults.map(r => r.entry)
    } else {
      // Text-based fuzzy search (default)
      const fuse = createFuse(index.functions)
      const searchResults = fuse.search(query.trim(), { limit: 50 })
      items = searchResults.map(result => result.item)
    }

    // Apply package filter
    return items.filter(item =>
      !filters?.packages || filters.packages.has(item.package)
    )
  }, [index, query, filters?.packages, mode])

  return {
    results,
    allFunctions: index?.functions ?? [],
    modules: index?.modules ?? [],
    isLoading,
    error,
    indexStats,
    availablePackages,
  }
}
