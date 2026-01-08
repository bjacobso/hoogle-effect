import { useState, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'
import type { FunctionEntry, SearchIndex } from '@hoogle-effect/api'

interface IndexStats {
  totalFunctions: number
  totalModules: number
  effectVersion: string
  packageCounts: Record<string, number>
}

export interface SearchFilters {
  packages?: Set<string>
}

interface UseSearchResult {
  results: FunctionEntry[]
  isLoading: boolean
  error: string | null
  indexStats: IndexStats | null
  availablePackages: string[]
}

// Global index cache
let indexCache: SearchIndex | null = null
let fuseCache: Fuse<FunctionEntry> | null = null

async function loadIndex(): Promise<SearchIndex> {
  if (indexCache) return indexCache

  const response = await fetch('/data/index.json')
  if (!response.ok) {
    throw new Error('Failed to load search index')
  }

  indexCache = await response.json()
  return indexCache!
}

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

export function useSearch(query: string, filters?: SearchFilters): UseSearchResult {
  const [index, setIndex] = useState<SearchIndex | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load index on mount
  useEffect(() => {
    loadIndex()
      .then(setIndex)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  // Compute search results
  const results = useMemo(() => {
    if (!index || !query.trim()) {
      return []
    }

    const fuse = createFuse(index.functions)
    const searchResults = fuse.search(query.trim(), { limit: 50 })

    return searchResults
      .map((result) => result.item)
      .filter((item) => !filters?.packages || filters.packages.has(item.package))
  }, [index, query, filters?.packages])

  // Compute index stats
  const indexStats = useMemo((): IndexStats | null => {
    if (!index) return null

    const packageCounts: Record<string, number> = {}
    for (const func of index.functions) {
      packageCounts[func.package] = (packageCounts[func.package] || 0) + 1
    }

    return {
      totalFunctions: index.functions.length,
      totalModules: index.modules.length,
      effectVersion: index.effectVersion,
      packageCounts,
    }
  }, [index])

  // Get available packages
  const availablePackages = useMemo(() => {
    if (!index) return []
    return [...new Set(index.functions.map((f) => f.package))]
  }, [index])

  return {
    results,
    isLoading,
    error,
    indexStats,
    availablePackages,
  }
}
