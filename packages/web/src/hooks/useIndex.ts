import { useState, useEffect, useMemo } from 'react'
import type { SearchIndex } from '@hoogle-effect/api'

interface IndexStats {
  totalFunctions: number
  totalModules: number
  effectVersion: string
}

// Global index cache (shared across hooks)
let indexCache: SearchIndex | null = null

async function loadIndex(): Promise<SearchIndex> {
  if (indexCache) return indexCache

  const response = await fetch('/data/index.json')
  if (!response.ok) {
    throw new Error('Failed to load search index')
  }

  indexCache = await response.json()
  return indexCache!
}

export function useIndex() {
  const [index, setIndex] = useState<SearchIndex | null>(indexCache)
  const [isLoading, setIsLoading] = useState(!indexCache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (indexCache) {
      setIndex(indexCache)
      setIsLoading(false)
      return
    }

    loadIndex()
      .then(setIndex)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  const indexStats = useMemo((): IndexStats | null => {
    if (!index) return null

    return {
      totalFunctions: index.functions.length,
      totalModules: index.modules.length,
      effectVersion: index.effectVersion,
    }
  }, [index])

  return { index, isLoading, error, indexStats }
}

// Export for cache sharing with useSearch
export { indexCache, loadIndex }
