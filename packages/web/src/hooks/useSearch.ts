import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { FunctionEntry } from '@hoogle-effect/api'
import { useIndex } from './useIndex'

interface IndexStats {
  totalFunctions: number
  totalModules: number
  effectVersion: string
}

interface UseSearchResult {
  results: FunctionEntry[]
  isLoading: boolean
  error: string | null
  indexStats: IndexStats | null
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

export function useSearch(query: string): UseSearchResult {
  const { index, isLoading, error, indexStats } = useIndex()

  // Compute search results
  const results = useMemo(() => {
    if (!index || !query.trim()) {
      return []
    }

    const fuse = createFuse(index.functions)
    const searchResults = fuse.search(query.trim(), { limit: 50 })

    return searchResults.map((result) => result.item)
  }, [index, query])

  return {
    results,
    isLoading,
    error,
    indexStats,
  }
}
