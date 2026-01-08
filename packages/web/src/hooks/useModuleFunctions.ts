import { useMemo } from 'react'
import type { FunctionEntry, ModuleEntry } from '@hoogle-effect/api'
import { useIndex } from './useIndex'

interface UseModuleFunctionsResult {
  functions: FunctionEntry[]
  module: ModuleEntry | null
  isLoading: boolean
  error: string | null
}

export function useModuleFunctions(moduleName: string | null): UseModuleFunctionsResult {
  const { index, isLoading, error } = useIndex()

  const result = useMemo(() => {
    if (!index || !moduleName) {
      return { functions: [], module: null }
    }

    const functions = index.functions
      .filter((f) => f.module === moduleName)
      .sort((a, b) => a.name.localeCompare(b.name))

    const module = index.modules.find((m) => m.name === moduleName) ?? null

    return { functions, module }
  }, [index, moduleName])

  return {
    ...result,
    isLoading,
    error,
  }
}
